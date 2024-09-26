const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


//Initialize  Express
const app = express();

//Middleware to parse JSON
app.use(express.json());

//Adding cors support
const cors = require('cors');
app.use(cors());


//MongoDB Connection
mongoose.connect('mongodb://localhost:27017/people-counter', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected")).catch(err => console.log(err));

//User Model
const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    counter: {type: Number, default: 0}
});

const User = mongoose.model('User', UserSchema);

//JWT secret
const JWT_SECRET = 'supersecretkey';

//Route: Register
app.post('/register', async(req, res) => {
    console.log('Register request received:', req.body);
    const {username, password} = req.body;

    if(!username || !password){
        return res.status(400).json({ message: "Username and password are required."})
    }
    //Hash the password
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(200).json({message: "User registered successfully."});
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({message: 'Error registering user'});
    }
});


//Route: Login
app.post('/login', async(req, res) => {
    console.log('Login request received:', req.body);
    const { username, password } = req.body;

    const user = await User.findOne({username});
    if(!user) {
        return res.status(400).send("Invalid credentials");
    }

    //Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return res.status(400).send("Invalid credentials");
    }

    //Create a JWT token
    const token = jwt.sign({ userId: user._id}, JWT_SECRET);
    res.json({ token });
});

//Middleware to authenticate the JWT token
function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];   // Extract token from 'Bearer <token>'
    
    if(!token) {
        return res.status(401).send("Token required");
    }

    jwt.verify(token, JWT_SECRET, { ignoreExpiration: false }, (err, user) => {
        if(err && err.name === "TokenExpiredError") {
            return res.status(403).send("Token Expired");
        } else if(err) {
            return res.send(403).send("Invalid Token");
        }
        req.user = user;    // Attach user information to the request
        next();     // Continue to the next middleware/route
    });
}

//Route: Get Counter (protected route)
app.get('/counter', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);  // Fetch user by ID from token
        if(!user) {
            res.status(404).json({ message: "User not found" });
        }
        res.json({ counter: user.counter });    // Respond with the user's counter
    } catch (error) {
        console.error("Error fetching user:", error); // Log the error for debugging
        res.status(500).json({ message: "Server error" });
    }
});

//Route: Update counter (protected counter)
app.put('/counter', authenticateToken, async (req, res) => {

    try {
        const { counter } = req.body;   // Get the new counter value from the request body

        const user = await User.findById(req.user.userId);  // Fetch user by ID from token
        if(!user){
            return res.status(404).json({ message: "User not found"});
        }
        user.counter = counter;     // Update the user's counter value
        await user.save();      // Save the updated user data to the database
        res.status(200).send("Counter updated");
    } catch (error) {
        console.error("Error updating counter:", error); // Log the error for debugging
        res.status(500).json({ message: "Server error" });
    }
});

//Start the server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});