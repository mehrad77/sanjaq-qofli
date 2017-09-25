var _ = require("lodash");
var TelegramBot = require('node-telegram-bot-api');
const low = require('lowdb')
var fs = require('fs');
const fileAsync = require('lowdb/lib/storages/file-async')
const id = 188406252; //mehrad id
function isAdmin(id,admins){
    var out = false;
    admins.forEach(function(admin) {
         if (id==admin) out = true;
         console.log(out);
    });
    return out;
}
const db = low('database.json', {
    storage: fileAsync
});
const log = low('log.json', {
    storage: fileAsync
});
db.defaults({ user: [],admis: [],analytics: [] })
    .write();
log.defaults({ sanjaq: [] })
    .write()
;
/*
states:
0:normal (normal)
1:wating for forward msg (wf-fm)
2:wating for choosing level (wf-cl)
3:wating for confirmation (wf-c)
4: have new msg (hnm)
*/
var token = process.env.TOKEN; //token

// Change this to wenhook fastest as you can (‍‍‍~mehrad)
var bot = new TelegramBot(token, { polling: true });
console.log("[...] Conected...");

var replyKayboardMobile = {keyboard:[[{text: "بفرست",request_contact: true}]],"one_time_keyboard":true};
var replyKayboardRemove = {ReplyKeyboardRemove:true};


//End of decraltions, start of codes
var intro = `سلام، من سنجاق‌قفلی‌ام. ^_^ من سعی می‌کنم که شما رو به کسی که دوستش دارید سنجاق کنم.
اگر اون هم شما رو سنجاق کرده باشه، من به جفتتون اطلاع می‌دم.`;
bot.onText(/((\/start|start|شروع))\b/,  function (msg, match) {
    var mainKey = {
		parse_mode:"HTML",
        reply_markup: JSON.stringify({
           inline_keyboard: [
                [
                    { text: "یکی رو برام سنجاق کن", callback_data: "btn_doSanjaq" }
                ],[
                    { text: "من رو کسی سنجاق کرده؟", callback_data: "btn_whoSanjaq_" + msg.chat.id}
                ]
            ]
        })
    };
    if(signup(msg.chat.id,msg.chat.first_name,msg.chat.username)){
        bot.sendMessage(msg.chat.id, intro , mainKey);
    }  
    else
        bot.sendMessage(msg.chat.id, "می‌خواهی کسی رو سنجاق کنی؟", mainKey);
});

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    console.log("["+callbackQuery.from.first_name+"|"+callbackQuery.from.username+"][callback_query]==> ",action);
    const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
    };
    var text;
    if(/(btn_)\w+/g.test(action)){
        text = action.substr(4);
        switch(text) {
            case "cansel":
                bot.editMessageText("خب بیخیالش شدیم :)",opts);
                break;
            case "doSanjaq":
                bot.sendMessage(msg.chat.id,"خب یه پیام از کسی که می‌خواهی سنجاقش کنم فوروارد می‌کنی برام؟");
                bot.editMessageReplyMarkup(main_Key,opts);
                break;
            case "manage":
                if(!isAdmin(msg.chat.id,admins))break;
                var list = getProdList(msg.chat.id);
                console.log("list : ",list)
                break;
            default:
                if(/(whoSanjaq_)\w+/g.test(action)){
                    var uid = text.substr(10);
                    console.log("uid",uid)
                    bot.answerCallbackQuery(callbackQuery.id, "کسانی شما رو سنجاق کردن اما شما اونا رو سنجاق نکردید. دوست داری بدونی کیان؟ \n فعلا نمی‌دونم باید چیکار کنی :|",false);
                }
        }
        bot.answerCallbackQuery(callbackQuery.id);
    }
});

// funstions // ------------------------------------------------------------------------------------------------------------------------------------------
function signup(chatid,first_name,username){
    //bot.sendMessage(id, chatid+" == "+first_name+" == @"+username);
    var chatIdExist = db.get('user').find({ id: chatid }).value()
        console.log("chatId",chatIdExist);
    if(chatIdExist){
        console.log("[...] user is registerd alredy",chatIdExist);
         return false;
    }
    else {
        var test = db.get('user')
        .push({ id: chatid, first_name: first_name,username:username,state:"normal",log:[{type:"signup",timestamp:new Date()}] })
        .write();
        console.log("[...] User created");
        return true;
    }
}

function isSignUp(chatid) {
    return false;
}

function getUserList(chatid){
    var chatIdExist = db.get('user')
                    .filter({available:true})
                    .filter({user_id:chatid})
                    .sortBy('timestamp')
                    .take(500)
                    .value()
    console.log("users: ",chatIdExist);
    // if(chatIdExist){return chatIdExist.credit;}
    // else {return false;}
    return chatIdExist;
}

    var addKey = {
		parse_mode:"HTML",
        reply_markup: JSON.stringify({
            "force_reply": true
        })
    };

    var main_Key = {
            inline_keyboard: [
                [
                    { text: "یکی رو برام سنجاق کن", callback_data: "btn_credit" }
                ],[
                    { text: "من رو کسی سنجاق کرده؟", callback_data: "btn_prod" }
                ]
            ]
    };
