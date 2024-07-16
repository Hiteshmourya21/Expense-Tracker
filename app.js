
const express = require('express');
const bodyParser = require('body-parser');
const notifier = require('node-notifier');

const mongoose = require('mongoose')
const User = require('./models/User');
const expenseSchema = require('./models/Expense');
const remainderSchema = require("./models/Remainder")
const categorySchema = require("./models/Category")

const app = express();

app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static("public"))
app.set("view engine",'ejs')

var username ="default" ;
var totalexp = 0;
var month = 0;


//DATABASE
 mongoose.connect('mongodb+srv://Hitesh:0zwKN11GryRsdbQr@cluster0.l5jm2ax.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.connect('mongodb://localhost:27017/myExpenseTracker', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

let expCol = db.collection('expenses');
const Expense = mongoose.model("Expense",expenseSchema)
const Remainder = mongoose.model("Remainder",remainderSchema)
const Category = mongoose.model("Category",categorySchema)

function calculateAverages(prices1, prices2) {
  const length = Math.max(prices1.length, prices2.length);
  const averages = [];

  for (let i = 0; i < length; i++) {
    const price1 = prices1[i] || 0;
    const price2 = prices2[i] || 0;
    const average = (price1 + price2) / 2;
    averages.push(average);
  }

  return averages;
}

function limitExceed(){
  notifier.notify({
    title: 'Limit Exceed',
    message: 'Please increase the expense limit in user section or Refrain yourself from further expense',

  });
}

function weeklyAlert(title, amount){
  notifier.notify({
    title: title + " Due",
    message: 'Your '+ title + ' expense is due of amount '+ amount  +' this week.',
  });
}

let seen = 0

app.get('/',function (req,res){
  res.render('SignUp');
})


app.get('/home',async(req,res)=>{
try {
    const user = await User.findOne({ name: username });
    if (!user) {
      notifier.notify({
        title: 'User Not Exist',
        message: 'Please Sign Up to proceed',
      });
  return;
}

// Filter items to include only income expenses and map their amounts
const incomeAmounts = user.items
  .filter(item => item.type === 'Income')
  .map(item => item.amount);

  const expenseAmounts = user.items
    .filter(item => item.type === 'Expense')
    .map(item => item.amount);

const average =  calculateAverages(incomeAmounts,expenseAmounts)


User.find({name:username}).then(foundlist=>
     {
    var recentItem = []
     foundlist.forEach(function(items){
       items.items.sort(function(a, b){
        return b.createdAt - a.createdAt 
       })
       
        for(let i=0;i<5;i++){
          recentItem.push(items.items[i])
        }

       })
       


var  expenseItem = []
  user.items.forEach(function(item){
  if(item.type == "Expense"){
    expenseItem.push(item)
  }
})
var valueList = []
Category.find().then(foundlist=>{
  foundlist.forEach(function(item){
    var n = 0;
    expenseItem.forEach(function(expItem){
      if(expItem.category == item.link){
        n+= expItem.amount;
      }
    })
    valueList.push(n)
  })
  res.render('home', { incomeAmounts, expenseAmounts, average, valueList, Items : recentItem});
})


   }).catch(err=>{
     console.log(err);
   })



 } catch (err) {
   res.status(500).send(err);
 }



 User.findOne({name:username}).then(foundItem=>{
   const currentDate = new Date();

   foundItem.remainder.forEach(function(item){
     if(item.timer == "Monthly"){
       const monthDate =currentDate.getMonth();
       if(monthDate >item.date.getMonth()){
         notifier.notify({
           title: item.title + " Due",
           message: 'Your '+ item.title + ' is due of amount '+ item.amount  +' this month.',
         });
         item.date = currentDate;
       }
     }
     else if(item.timer == "Daily"){
       const dailyDate = currentDate.getDate();
       if(dailyDate > item.date.getDate()+1){
         notifier.notify({
           title: item.title + " Due",
           message: 'Your '+ item.title + ' is due of amount '+ item.amount  +' Daily.',
         });
         item.date = currentDate;
       }
       else if((item.date.getDate() == 30 && item.date.getDate() != dailyDate) || (item.date.getMonth() == 1 && item.date.getDate() > 28)){
          item.date = new Date('2024-01-01T14:20:34+02:00')
       }
     }
     else if(item.timer == "Weekly"){
       let weekDate = currentDate.getDay();
       if(item.date.getDay() == weekDate){
          if(seen == 0){
            weeklyAlert(item.title,item.amount)
            seen = 1
          }
       }
     }
   })
   foundItem.save()
 })

})

app.get("/user",function(req,res){
  User.findOne({name:username}).then(foundlist =>{
    var dailylimit = parseInt(foundlist.limit/30);
    res.render("user",{User:foundlist,DailyLimit: dailylimit});
  }).catch(err=>{
    console.log("Error Found on User page :",err)
  })
})

app.post("/user",function(req,res){
let userbutton = req.body.userButton;
if(userbutton == "Delete"){
  User.findOneAndDelete({name:username}).then(foundItem=>{
    console.log("User Deleted");
    username = ''
    res.redirect('/')
  }).catch(err=>{
    console.log("Error deleting user"+err)
  })
}
else if(userbutton == "limit"){
  User.findOne({name:username}).then(foundItem=>{
    foundItem.limit = req.body.Limit;
    foundItem.save();
    res.redirect('/home')
  }).catch(err=>{
    console.log("Error Found"+err)
  })
}
else if(userbutton == "Logout"){
  username = ""
  notifier.notify({
    title: 'User Logout Successfully',
    message: 'Please Log In to proceed',
  });
  res.redirect("/")
}


})

app.get('/add-income',async(req,res)=>{
  let totalIncome = 0;
  let balance = 0 ;
  const incomeItems = []
  User.find({name:username}).then(foundItems =>{
    foundItems.forEach(function(items){
      balance = items.money;
      items.items.forEach(function(item){
        if(item.type ==="Income"){
          totalIncome = totalIncome + item.amount;
          incomeItems.push(item)
        }
      })
      res.render("income",{ItemList : incomeItems,totalIncome:totalIncome,Yourbalance:balance})
      })
  }).catch(err =>{
    console.log("Fetching Error:"+err)
  })

})

app.get('/add-expense',function(req,res){
  let totalExpense = 0;
  var balance = 0 ;

  User.find({name:username}).then(foundItems =>{
    const expenseItems = []
    const categoryItems = []
    foundItems.forEach(function(items){
      balance = items.money;
      items.items.forEach(function(item){
        if(item.type === "Expense"){
          totalExpense = totalExpense + item.amount;
          expenseItems.push(item)
        }
      })
      totalexp = totalExpense;
      })

      Category.find().then(foundItems=>{
        foundItems.forEach(function(item){
          categoryItems.push(item)
        })
      res.render("expense",{ItemList : expenseItems,totalExpense :totalExpense,Yourbalance:balance,CategoryList:categoryItems})
      })

  }).catch(err =>{
    console.log("Fetching Error:"+err)
  })

})

app.get('/Item/:ItemId',function(req,res){
  let reqID = req.params.ItemId;
  User.find({name:username}).then(foundItems=>{
    foundItems.forEach(function(items){
      items.items.forEach(function(item){
        if(reqID == item.id){
          res.render("item",{Item : item})
        }
      })
    })
  })
  .catch(err =>{
    console.log("Fetching Error:"+err)
  })
})

app.get('/set-remainder',function(req,res)
{
      User.find({name:username}).then(foundlist =>{

        foundlist.forEach(function(items){
          res.render("remainder",{Items:items.remainder})
      })
    })
})

app.get('/add-category',function(req,res){
  //Adding Single Category
  // let categoryItem = new Category({
  //   name:"Food" ,
  //   link:"fa-solid fa-utensils"
  // })
  // categoryItem.save()

  //Adding Multiple category
//   let listc = [
//   {
//     name: 'Food',
//     link: 'fa-solid fa-utensils'
//
//   },
//   {
//     name: 'Shopping',
//     link: 'fa-solid fa-cart-shopping'
//
//   },
//   {
//
//     name: 'Rent',
//     link: 'fa-solid fa-truck-ramp-box'
//
//   },
//   {
//
//     name: 'Travel',
//     link: 'fa-solid fa-globe'
//
//   },
//   {
//
//     name: 'policy',
//     link: 'fa-solid fa-building-shield'
//
//   },
//   {
//
//     name: 'Laundry',
//     link: 'fa-solid fa-jug-detergent'
//
//   },
//   {
//
//     name: 'Insurances',
//     link: 'fa-solid fa-car-burst'
//
//   },
//   {
//
//     name: 'Health Care',
//     link: 'fa-solid fa-heart'
//
//   },
//   {
//
//     name: 'Tax',
//     link: 'fa-solid fa-money-check-dollar'
//
//   }
// ]
//   Category.insertMany(listc).catch(err=>{
//     console.log(er)
//   })

})

app.get('/history',function (req,res){
  User.find({name:username}).then(foundlist=>{
    let IncomeList = []
    let ExpenseList = []

    foundlist.forEach(function(items){
      items.items.forEach(function(item){
        if(month == item.date.getMonth()){
          if(item.type == "Income"){
            IncomeList.push(item)
          }
          else{
            ExpenseList.push(item)
          }
        }
      })
      res.render('history',{IList: IncomeList, EList: ExpenseList});
      
    })
    
  }).catch(err=>{
    console.log(err)
  })
 
  
})

app.post('/history',function (req,res){
   month = req.body.month;

  res.redirect('history');
})

app.post("/SignUP",function(req,res){
  const p1 = req.body.password1;
  const p2 = req.body.password2;
  const name = req.body.UserName;
  if(p1 != p2){
    res.status(400).send("Password Do not match")
  }
  else if(!name || !p1 || !p2){
    res.status(400).send("All fields are required")
  }
  else{

    const newUser = new User({
      name : name,
      password:p1,
      items : []
    })
    newUser.save()
    username = name;
    notifier.notify({
      title: 'User Created Successfully',
      message: 'Please Sign In to proceed',
    });
    
    res.redirect("/")
  }
})

app.post("/Login",function(req,res){
  const password = req.body.password;
  const name = req.body.UserName;

  User.findOne({name:name,password:password}).then(foundItem=>{
    username = name
    res.redirect("/home")
  })


})

app.post("/add-income",function(req,res){
  const title = req.body.incomeTitle;
  const amount = req.body.incomeAmount;
  const desc = req.body.incomeDesciption;
  const date = req.body.Date;

  const incomeItem = new Expense({
    title : title,
    amount : amount,
    description : desc,
    date : date,
    type : "Income",
    category:"fa-solid fa-wallet"
  })
  if(!title || !amount || !desc ||!date){
    res.status(400).send("All fields are required")
  }
  else if(amount<=0 || amount=='number'){
    res.status(400).send("Enter a valid amount")
  }else{
    incomeItem.save();
    User.findOne({name:username}).then(foundlist=>{
      foundlist.money = parseInt(foundlist.money) + parseInt(amount);
      foundlist.items.push(incomeItem);
      foundlist.save();
      recentItem = []
      res.redirect("/add-income")
    }).catch(err=>{
      console.log(err);
    })

  }

})

app.post("/add-expense",function(req,res){
  const title = req.body.expenseTitle;
  const amount = req.body.expenseAmount;
  const desc = req.body.expenseDesciption;
  const date = req.body.Date;
  const category = req.body.category;



  const expenseItem = new Expense({
    title : title,
    amount : amount,
    description : desc,
    date : date,
    type : "Expense",
    category:category
  })
  if(!title || !amount || !desc ||!date){
    res.status(400).send("All fields are required")
  }
  else if(amount<=0 || amount=='number'){
    res.status(400).send("Enter a valid amount")
  }
  else{
    expenseItem.save();
    User.findOne({name:username}).then(foundlist=>{

      if(parseInt(totalexp) + parseInt(amount)  > parseInt(foundlist.limit)){
         limitExceed()
      }
      else{
        foundlist.money = parseInt(foundlist.money) - parseInt(amount);
        foundlist.items.push(expenseItem);
        foundlist.save();
        recentItem = []
        res.redirect("/add-expense")
      }
    }).catch(err=>{
      console.log(err);
    })

    expCol.deleteMany({});
  }
})

app.post('/Item/:ItemId/',function(req,res){
  let id = req.params.ItemId;
  let type = req.body.type;
  let buttontype = req.body.button

  if(buttontype == "Delete"){
    User.updateOne(
      {name:username},
      {$pull:{items:{_id :id }}}
    )
  .then(()=>{
    if(type == 'Income'){
      res.redirect("/add-income")
    }
    else{
      res.redirect("/add-expense")
    }
    }).catch(err=>{
      console.log("Fetching Error:"+err);
    })
  }
  else if(buttontype == "Edit"){

  }

})

app.post('/set-remainder',function(req,res){
  const title = req.body.Title;
  const amount = req.body.Amount;
  const date = req.body.Date;
  const timer = req.body.timer;
  let deleteR = req.body.deleteRemainder;
    if(deleteR == "True"){
      let id = req.body.Id;
      User.updateOne(
        {name:username},
        {$pull:{remainder:{_id :id }}}
      )
    .then(()=>{
        res.redirect("/set-remainder")
      }).catch(err=>{
        console.log("Fetching Error:"+err);
      })
    }
else{
  const remainderItem = new Remainder({
    title : title,
    amount : amount,
    date : date,
    timer : timer
  })
  if(!title || !amount || !timer ||!date){
    res.status(400).send("All fields are required")
  }
  else if(amount<=0 || amount=='number'){
    res.status(400).send("Enter a valid amount")
  }
  else{
    remainderItem.save();
    User.findOne({name:username}).then(foundlist=>{
        foundlist.remainder.push(remainderItem);
        foundlist.save();
        res.redirect("/set-remainder")
    }).catch(err=>{
      console.log(err);
    })
  }
}

})


let port = process.env.PORT;
if(port== null||port==""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully")
})
