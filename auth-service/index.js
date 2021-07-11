const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./UserModel');

const app = express();
const mongoDBConnectionUrl = 'mongodb://localhost:27019/eshop-auth-service';
const PORT = process.env.PORT || 5050;
app.use(express.json());
//app.use(cors());

mongoose.connect(
    mongoDBConnectionUrl,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    () => {
        console.log(`Eshop-auth-service connected to Database`);
    }
);



app.get('/', (req, res) => {
    return res.send('E-Shop running here.')
});

//login user
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if(!user){
        return res.status(404).send('User not found');
    }
    if(password !== user.password){
        return res.status(400).send('Invalid credentials');
    }
    const payload = {
        email,
        name: user.name
    };

    jwt.sign(payload, 'secretKey', (err, token) => {
        if(err){
            return res.status(500).json(err);
        }
        return res.json({ token });
    });
});

// Register user
app.post('/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    const userExists = await User.findOne({ email });
    if(userExists){
        return res.status(400).send('User already registered');
    }else{
        const newUser = new User({
            name,
            email,
            password, // TODO: Hash this password
        });
        newUser.save();
        return res.json(newUser);
    }
});

app.listen(PORT, () => {
    console.log(`Auth service is running on port: ${PORT}`);
});