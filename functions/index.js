//firebase deploy --only functions

const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const nodemailer = require('nodemailer');
const express = require('express');

//grab config files from firebase and intialize app
const firebaseApp = firebase.initializeApp(
  functions.config().firebase
);

//email config variables stored on server
var gmailemail = functions.config().gmailconfig.email;
var gmailpassword = functions.config().gmailconfig.password;

//get access to database

//setup mail transport
let transporter = nodemailer.createTransport({
    secure: true,
    service: 'gmail',
    auth: {
        user: 'internal.prestoncinema@gmail.com',
        pass: gmailpassword
    }
});

//setup email being sent
let mailOptions = {
    from: 'internal.prestoncinema@gmail.com',
    to: 'roque@prestoncinema.com',
    subject: 'Firebase Functions Sent',
    text: 'Email sent from firebase functions!'
};

//setup trigger on firebase database entry
exports.testSubmitted = functions.database
  .ref('/tests')
  .onWrite(event => {
    // Grab the current value of what was written to the Realtime Database.
    const original = event.data.val();
    console.log('triggered!');

    // console.log(admin.database().ref('/tests'));

    //uncomment below for sending emails
    return sendTestEmail();
});


// Sends email
function sendTestEmail() {
  return transporter.sendMail(mailOptions)
    .then(() => {
      console.log('success');
    })
    .catch((error) => {
      console.error('There was an error while sending the email:', error);
    });
}
