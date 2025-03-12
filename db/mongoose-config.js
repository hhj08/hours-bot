const mongoose = require('mongoose');
require('dotenv').config();

const mongooseConnect = () => {
    mongoose.set('strictQuery', false);

    mongoose.connect(process.env.DB);
    const db = mongoose.connection;

    db.on("error", (err)=>{
        console.error(`db connect fail : ${JSON.stringify(err)}`);
    });

    db.once("open", ()=> {
        console.log(`db connect success`);
    });
}

module.exports = mongooseConnect;