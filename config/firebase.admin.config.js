const admin = require('firebase-admin')
const { getAuth } = require('firebase-admin/auth')
const serviceAccount = require('../ohmydog-2-firebase-adminsdk-9ex7e-4c854dc548.json')

const app = admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
})

const auth = getAuth(app)
const db = admin.firestore()

module.exports = { admin, auth, db }
