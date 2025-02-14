const express = require('express');
const router = express.Router();
const axios = require('axios');

const PYTHON_API_URL = 'http://localhost:5001';

router.post('/chatbot', async (req, res) => {
    const { message,user   } = req.body;
    console.log(user);


    try {
        
        if(!user){
            const chatbotResponse = await axios.post(`${PYTHON_API_URL}/chat`, {
                userId: 1, 
                message: message,
               
            })
            res.status(200).json({ response: chatbotResponse.data });
        }else{
            const chatbotResponse = await axios.post(`${PYTHON_API_URL}/chat`, {
                userId: user.id,
                message: message,
                skillsPreferences: [user.areas_of_interest],
                accessibilityNeeds: [user.accessibility_features],
            });
            res.status(200).json({ response: chatbotResponse.data });
        }
        
    } catch (error) {
        console.error("Error communicating with Python API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
