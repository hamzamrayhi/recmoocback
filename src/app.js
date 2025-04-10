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
const recommenderroutes = require('./routes/recommender');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use('/', enumsRouter);
app.use('/',registerRouter);
app.use('/',verifyRouter);
app.use('/',forgetpasswordRouter)
app.use('/', loginRouter)
app.use('/',searchbarRouter)
app.use('/',userSettingsRouter)
app.use('/',coursesdisplayRouter)
app.use('/',reviewRouter)
app.use('/',categoryRouter)
app.use('/',contactusRouter)
app.use('/',adminRouter)
app.use('/',bookmarksRouter)
app.use('/',userStudyScheduleRouter)
app.use('/',accessibilty_checkerRouter)
app.use('/',toolbar_profilesRouter)
app.use('/', chatbotRoutes);
app.use('/', recommenderroutes);



module.exports = app;