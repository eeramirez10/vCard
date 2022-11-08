const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const shortid = require('shortid');
const vCardJS = require('vcards-js');
const QRCode = require('qrcode');
const QRLogo = require('qr-with-logo');


const qrConfig = {
    color: {
        dark: '#000000',
        light: '#FFF',
    },
    // width: 200,
    // height: 200,
    errorCorrectionLevel: 'H',
    rendererOpts: { quality: 0.3 }

};

const VCardSchema = mongoose.Schema({
    slug: {
        type: String,
        default: shortid.generate,
    },

    // Contact data
    firstname: {
        type: String,
        default: '',
    },

    lastname: {
        type: String,
        default: '',
    },

    email: {
        type: String,
        default: '',
    },

    phone: {
        type: String,
        default: '',
    },

    website: {
        type: String,
        default: ''
    },

    street: {
        type: String,
        default: ''
    },

    street_no: {
        type: String,
        default: ''
    },

    zip: {
        type: String,
        default: ''
    },

    city: {
        type: String,
        default: ''
    },

    company: {
        type: String,
        default: ''
    },

    job: {
        type: String,
        default: ''
    },

    // Dates
    created_at: {
        type: Date,
        default: Date.now,
    },

    updated_at: {
        type: Date,
        default: Date.now,
    },
});


VCardSchema.methods.getVCF = function () {
    const v = vCardJS();

    console.log(this)

    v.firstName = this.firstname;
    v.lastName = this.lastname;

    v.workEmail = this.email;
    v.workPhone = this.phone;
    v.workUrl = this.website;

    v.workAddress.label = 'Workplace';
    v.workAddress.street = `${this.street_no}, ${this.street}`;
    v.workAddress.postalCode = this.zip;
    v.workAddress.city = this.city;

    v.organization = this.company;
    v.title = this.job;
    v.role = this.job;

    v.source = `http://domain.test/${this.slug}/contact.vcf`;

    // v.version = '3.0';

    return v;
};

VCardSchema.methods.getDir = function () {
    const cardsDir = path.join(__dirname, `../public/cards/${this.slug}/`);

    if (!fs.existsSync(cardsDir)) {
        fs.mkdirSync(cardsDir, { recursive: true });
    }

    return cardsDir;
}

// Updating the updated date on each save
VCardSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

// Generating dynamic QR Code only on creation
VCardSchema.pre('save', function (next) {


    if (this.isNew) {
        const qrPath = `${this.getDir()}/dynamic-qrcode.png`;
        QRCode.toFile(qrPath, `http://192.168.1.83:8080/${this.slug}/contact.vcf`, qrConfig, function (err) {
            if (err) {
                console.error(err);
            }
            next();
        });
    } else {
        next();
    }
});

// Generating vCard file
VCardSchema.pre('save', function (next) {
    const v = this.getVCF();

    v.saveToFile(`${this.getDir()}/contact.vcf`)

    next();
});

//Generating vCard QR Code with logo

VCardSchema.pre('save', function (next){
    const qrPath = `${this.getDir()}/static-qrcode-with-logo.png`;
    const v = this.getVCF();

    QRLogo.generateQRWithLogo(
        v.getFormattedString(),
        'logo-tuvansa.png', {
        errorCorrectionLevel: 'H',
        rendererOpts: { quality: 0.3 }
    },
        "PNG", qrPath
    )

    next()
})

// Generating vCard QR Code
VCardSchema.pre('save', function (next) {
    const qrPath = `${this.getDir()}/static-qrcode.png`;
    const v = this.getVCF();


    QRCode.toFile(qrPath, v.getFormattedString(), qrConfig, function (err) {
        if (err) {
            console.error(err);
        }
        next();
    })
});

// Cleaing up folder
VCardSchema.post('remove', function (next) {
    next();
});

module.exports = mongoose.model('VCard', VCardSchema);