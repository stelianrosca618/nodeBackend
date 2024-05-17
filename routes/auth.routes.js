const { Router } = require('express')
const route = Router()

const {
	signup,
	login,
	logout,
	resetPassword,
	resendEmailVerification,
	changePassword,
} = require('../controllers/auth.controllers')

route
	.post('/signup', signup)
	.post('/login', login)
	.post('/logout', logout)
	.post('/reset-password', resetPassword)
	.post('/change-password', changePassword)
	.post('/resend-email-verification', resendEmailVerification)

module.exports = route
