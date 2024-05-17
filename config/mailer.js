require("dotenv").config();
const nodemailer = require('nodemailer');
const secure = process.env.googlePassword_O;

console.log('secure', secure)
//create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
host:"smtp.gmail.com",
port: 465,
secure: true, // true for 465, false for other ports
auth:{
user: 'tomas@ohmydog.io',
// generated ethereal user
pass: secure || 'ivgnjjzwwypxitsu',
// generated ethereal password
}
})

module.exports = {transporter};