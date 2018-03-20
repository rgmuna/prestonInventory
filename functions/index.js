//firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
admin.initializeApp(functions.config().firebase);

// var email = config.ADMIN_EMAIL;
// var pw = config.ADMIN_PASS;

// const gmailEmail = functions.config().gmail.email;
// const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'test@test.com',
    pass: 'asdfasdf'
  }
});


exports.testSubmitted = functions.database
  .ref('/tests')
  .onWrite(event => {
    // const dsnap = event.data;
  // Grab the current value of what was written to the Realtime Database.
  const original = event.data.val();
  // console.log('triggered!', event.params.pushId, original);
  // You must return a Promise when performing asynchronous tasks inside a Functions such as
  // writing to the Firebase Realtime Database.
  return sendTestEmail('roque@prestoncinema.com');


});


// Sends a welcome email to the given user.
function sendTestEmail(email) {
  const mailOptions = {
    from: '"Test Submission"<noreply@example.com>',
    to: email,
    subject: 'Test Submitted',
    text: 'hello world'
  };
  // The user subscribed to the newsletter.
  // mailOptions.subject = `Test submitted!`;
  // mailOptions.text = `Hey there! Welcome to asdf. I hope you will enjoy our service.`;
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('New welcome email sent to:', email);
  })
  .catch((error) => console.error('There was an error while sending the email:', error));

}
