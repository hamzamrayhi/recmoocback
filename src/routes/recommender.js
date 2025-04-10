const express = require('express');
const router = express.Router();
const axios = require('axios');

const PYTHON_API_URL = 'http://localhost:5001';

router.post('/recommender', async (req, res) => {
    const { user } = req.body;
    console.log(user);
    try {
        
            const chatbotResponse = await axios.post(`${PYTHON_API_URL}/recommender`, {
             
              
                skillsPreferences: [user.areas_of_interest],
                accessibilityNeeds: [user.accessibility_features],
            });
            console.log(chatbotResponse.data);
            res.status(200).json({ response: chatbotResponse.data });
        
        
    } catch (error) {
        console.error("Error communicating with Python API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
