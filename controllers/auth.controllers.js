require('dotenv').config()
const { admin, auth, db } = require('../config/firebase.admin.config')
const firebase = require('firebase-admin')
const { transporter } = require('../config/mailer')
const path = require('path')

const handlebars = require('handlebars')
const fs = require('fs')

const particularPath = path.join(
	__dirname,
	'../mail_templates/particular-welcome.hbs'
)
const particularWelcome = handlebars.compile(
	fs.readFileSync(particularPath, 'utf8')
)
const profesionalPath = path.join(
	__dirname,
	'../mail_templates/profesional-welcome.hbs'
)

const profesionalWelcome = handlebars.compile(
	fs.readFileSync(profesionalPath, 'utf8')
)

const verificationPath = path.join(
	__dirname,
	'../mail_templates/email-verification.hbs'
)
const verificationEmail = handlebars.compile(
	fs.readFileSync(verificationPath, 'utf8')
)

const bcrypt = require('bcrypt')
const saltRounds = 10

const domain = process.env.DOMAIN

const setUserProfileData = async (
	userProfile,
	typeOfUser,
	verificationLink
) => {
	try {
		if (typeOfUser === 'user') {
			await db.collection('users').doc(userProfile.uid).set(userProfile)
			console.log('profile created & added')
			//Welcome email individual
			const html = particularWelcome({ name: userProfile.name })
			console.log('done html')
			await transporter.sendMail({
				from: 'Oh My Dog - Bienvenidx <tomas@ohmydog.io>',
				to: userProfile.email,
				subject: 'Bienvenidx a OMD',
				html: html,
			})
			console.log('send email')
		} else {
			//welcome email profesional
			const html = profesionalWelcome({ name: userProfile.name })
			await transporter.sendMail({
				from: 'Oh My Dog - Bienvenidx <tomas@ohmydog.io>',
				to: userProfile.email,
				subject: 'Bienvenidx a OMD',
				html: html,
			})
		}

		const html = verificationEmail({
			name: userProfile.name,
			verificationLink: verificationLink,
		})

		await transporter.sendMail({
			from: 'Oh My Dog - Verifica tu correo <tomas@ohmydog.io>',
			to: userProfile.email,
			subject: 'Verifica tu correo',
			html: html,
		})

		await transporter.sendMail({
			from: '<tomas@ohmydog.io>',
			to: 'tomas@ohmydog.io',
			subject: 'Nuevo Usuario',
			html: `
                <div dir="ltr">
                  <p>Tenemos un nuevo usuario:</p>
                  <p>Nombre: ${userProfile.name}</p>
                  <p>Email: ${userProfile.email}</p>
                  <p>Tipo de usuario: ${typeOfUser}</p>
                  <div>
                  </div>
                </div>
                `,
		})
		console.log('done setUserProfile')
		return
	} catch (e) {
		throw new Error(e)
	}
}

exports.signup = async (req, res) => {
	try {
		const { email, password, displayName, phoneNumber } = req.body
		// Puedo tener el los perfiles como rutas privadas y que todos sean iguales y
		//Tener las rutas posicionables /criador-de-perros/los-baganes y esa ser la ruta pública
		const user = await admin.auth().createUser({ email, password, displayName })

		const passwordHash = await bcrypt.hash(password, saltRounds)

		const url = domain
		const actionCodeSettings = {
			url: url,
			handleCodeInApp: false,
		}

		const profile = {
			createdAt: firebase.firestore.FieldValue.serverTimestamp(),
			email: user.email,
			email_verified: user.emailVerified,
			password: passwordHash,
			name: user.displayName,
			phone: phoneNumber,
			uid: user.uid,
			providerId: user.providerData[0].providerId,
			liked_adverts: [],
			profile_saveds: [],
			saved_searches: [],
			opinions: [],
			dog_profiles: [],
		}

		const link = await auth.generateEmailVerificationLink(
			user.email,
			actionCodeSettings
		)
		await setUserProfileData(profile, 'user', link)
		console.log('profile', profile)

		return res.status(200).json({ message: 'user created' })
	} catch (e) {
		return res.status(400).json({ message: `Llamada fallida: ${e}` })
	}
}

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body
		console.log('req.body', req.body)
		let user
		const usersRef = await db.collection('users')
		const querySnapShot = await usersRef.where('email', '==', email).get()
		querySnapShot.forEach((doc) => {
			user = doc.data()
		})

		if (!user) {
			return res
				.status(400)
				.json({ message: `No existe ningún usuario con ese email` })
		}

		console.log('user', user)
		const match = await bcrypt.compare(password, user.password)
		if (!match) {
			return res.status(400).json({ message: `Contraseña incorrecta` })
		}
		return res.status(200).json(user)
	} catch (e) {
		console.log('e', e)
		return res.status(400).json({ message: `Llamada fallida: ${e}` })
	}
}

exports.logout = async (req, res) => {
	try {
		await admin.auth().signOut()
		return res.status(200).json({})
	} catch (e) {
		return res.status(400).json({ message: `Llamada fallida: ${e}` })
	}
}

//En esa función el usuario, no está logeado
//Por lo tanto necesito saber si existe ese correo.
exports.resetPassword = async (req, res) => {
	try {
		const { email } = req.body
		//Ha de ser la landing page para recuperar la constraseña
		const resetUrl = 'https://ohmydog.io'
		const userRecord = await admin.auth().getUserByEmail(email)
		if (!userRecord) {
			return res
				.status(400)
				.json({ message: `Usuario con email: ${email} no existe` })
		}
		await admin.auth().sendPasswordResetEmail(email, { url: resetUrl })
		return res.status(200).json({})
	} catch (e) {
		return res.status(400).json({ message: `Llamada fallida: ${e}` })
	}
}

//Esta función estará en el formulario de cambiar la contraseña.
exports.changePassword = async (req, res) => {
	try {
		const { email, oldPassword, newPassword } = req.body
		const user = await admin
			.auth()
			.signInWithEmailAndPassword(email, oldPassword)
		await user.updatePassword(newPassword)
		return res.status(200).json({})
	} catch (e) {
		return res.status(400).json({ message: `Llamada fallida: ${e}` })
	}
}

exports.resendEmailVerification = async (req, res) => {
	try {
		const actionCodeSettings = {
			url: `https://ohmydog.io/`,
			handleCodeInApp: false,
		}
		await admin.auth().currentUser.sendEmailVerification(actionCodeSettings)
		return res.status(200).json({})
	} catch (e) {
		return res.status(400).json({ message: `Llamada fallida: ${e}` })
	}
}
