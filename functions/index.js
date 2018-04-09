//firebase deploy --only functions

const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const nodemailer = require('nodemailer');
const path = require('path');
// const Promise = require('bluebird');
const express = require('express');
const Email = require('email-templates');

//grab config files from firebase and intialize app
const firebaseApp = firebase.initializeApp(
  functions.config().firebase
);

//email config variables stored on server
const gmailemail = functions.config().gmailconfig.email;
const gmailpassword = functions.config().gmailconfig.password;
// const gmailemail = 'internal.prestoncinema@gmail.com';
// const gmailpassword = 'infollowfocuswetrust';

//setup email being sent
let mailOptions = {
    from: 'internal.prestoncinema@gmail.com',
    to: 'roque@prestoncinema.com',
    subject: 'Firebase Functions Sent',
    text: 'Email sent from firebase functions!'
};

//make array of inventory units from database ----------------------------------
//get access to database
function getInventory() {
  const ref = firebaseApp.database().ref('inventory');
  return ref.once('value').then(snap => makeTable(snap.val()));
}

// let unitsArray = [];

function makeTable(data){
  // let unitInit = {
  //   dm1x: {name: 'dm1x', number: 0},
  //   dm2x: {name: 'dm2x', number: 0},
  //   dm5: {name: 'dm5', number: 0},
  //   dmf3: {name: 'dmf3', number: 0},
  //   fi: {name: 'fi', number: 0},
  //   hu3: {name: 'hu3', number: 0},
  //   lr2: {name: 'lr2', number: 0},
  //   vou: {name: 'vou', number: 0},
  //   mdr3: {name: 'mdr3', number: 0},
  //   mdr4: {name: 'mdr4', number: 0},
  //   rmf: {name: 'rmf', number: 0},
  //   vf3: {name: 'vf3', number: 0}
  // }
  //
  // for(var unit in data){
  //   var item = unit.toLowerCase();
  //
  //   if(unit.indexOf('vou')){
  //
  //   }
  //   else{
  //     unitInit[unit].number++;
  //   }
  // }
  return console.log(data);
}

//create templates -------------------------------------------------------------
//setup mail transport
let transporter = nodemailer.createTransport({
    secure: true,
    service: 'gmail',
    auth: {
        user: 'internal.prestoncinema@gmail.com',
        pass: gmailpassword
    }
});
//
// const unitsArray = [
//   {unit: 'FI', number: '10'},
//   {unit: 'HU3', number: '11'},
//   {unit: 'MDR3', number: '12'}
// ]

const email = new Email({
  message: {
    from: 'internal.prestoncinema@gmail.com'
  },
  send: true,
  transport: transporter,
  textOnly: true
});

function sendTestEmail(){
    return email.send({
        template: 'submit',
        message: {
          to: 'roque@prestoncinema.com'
        },
        locals: {
          unitArray:  unitsArray
        }
      })
      .then(console.log)
      .catch(console.error);
}

exports.testSubmitted = functions.database
  .ref('/tests')
  .onWrite(event => {

    // Grab the current value of what was written to the Realtime Database.
    const original = event.data.val();
    console.log('triggered!');

    return getInventory();
    // return sendTestEmail();
});

// ---------------- ARCHIVE ----------------------------------------------------

// Sends email
// function sendTestEmail() {
//   return transporter.sendMail(mailOptions)
//     .then(() => {
//       console.log('success');
//     })
//     .catch((error) => {
//       console.error('There was an error while sending the email:', error);
//     });
// }
//
//
//setup trigger on firebase database entry
