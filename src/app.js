const express = require('express');
const cors = require('cors');
const enumsRouter = require('./routes/enums');
const registerRouter = require('./routes/register');
const verifyRouter = require('./routes/verify');
const forgetpasswordRouter = require('./routes/forget_password');
const loginRouter = require('./routes/login');
const searchbarRouter = require('./routes/searchbar');
const userSettingsRouter=require('./routes/usersettings');
const coursesdisplayRouter=require('./routes/coursesdisplay');
const reviewRouter = require('./routes/reviews');
const categoryRouter = require('./routes/category');
const contactusRouter = require('./routes/contactus');
const adminRouter = require('./routes/admin');
const bookmarksRouter=require('./routes/bookmarks');
const userStudyScheduleRouter =require('./routes/userstudyschedule');
const accessibilty_checkerRouter = require ('./routes/accessibility_checker');
const toolbar_profilesRouter = require('./routes/toolbar_profiles');
const chatbotRoutes = require('./routes/chatbot');



const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/uploads", express.static("uploads"));
app.use('/api', enumsRouter);
app.use('/api',registerRouter);
app.use('/api',verifyRouter);
app.use('/api',forgetpasswordRouter)
app.use('/api', loginRouter)
app.use('/api',searchbarRouter)
app.use('/api',userSettingsRouter)
app.use('/api',coursesdisplayRouter)
app.use('/api',reviewRouter)
app.use('/api',categoryRouter)
app.use('/api',contactusRouter)
app.use('/api',adminRouter)
app.use('/api',bookmarksRouter)
app.use('/api',userStudyScheduleRouter)
app.use('/api',accessibilty_checkerRouter)
app.use('/api',toolbar_profilesRouter)
app.use('/api', chatbotRoutes);


module.exports = app;