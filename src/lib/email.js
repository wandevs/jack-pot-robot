const nodeMailer = require('nodemailer');
const log = require('./log');

log.info("lib email init");

// qq email
// const transporter = nodeMailer.createTransport({
//   service: process.env.EMAIL_PORT,
//   port: parseInt(process.env.EMAIL_PORT), // SMTP port
//   secureConnection: true, // 使用了 SSL
//   auth: {
//       user: process.env.EMAIL_FROM,
//       pass: process.env.EMAIL_AUTH_CODE,
//   }
// });

// 163 email
const transporter = nodeMailer.createTransport({
    host: process.env.EMAIL_SERVICE,
    port: parseInt(process.env.EMAIL_PORT),
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_AUTH_CODE,
    }
  });

const mailOptions = {
    from: process.env.EMAIL_FROM_NAME, // sender address
    to: process.env.EMAIL_TO_NAME, // list of receivers
    subject: 'Hello', // Subject line
    // send text or html
    // text: 'Hello world?', // plain text body
    html: '<b>Hello world?</b>' // html body
};

// send mail with defined transport object
const sendMail = async (subject, content) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM_NAME, // sender address
        to: process.env.EMAIL_TO_NAME, // list of receivers
        subject: subject,
        html: `<b>${content}</b>`
    };

    const info = await transporter.sendMail(mailOptions);
    log.info('Message sent: %s', info.messageId);
};

module.exports = sendMail;