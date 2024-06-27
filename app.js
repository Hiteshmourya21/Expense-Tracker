
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const User = require('./models/User');
const expenseSchema = require('./models/Expense');
const app = express();

app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static("public"))
app.set("view engine",'ejs')

var username ="" ;
//DATABASE
 // mongoose.connect('mongodb://localhost:27017/myExpenseTracker', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

let expCol = db.collection('expenses');
const Expense = mongoose.model("Expense",expenseSchema)

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


app.get('/',function (req,res){
  res.render('SignUp');
})


app.get('/home',async(req,res)=>{
  try {
    const user = await User.findOne({ name: username });

if (!user) {
  console.log('User not found');
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
   User.find({name:username}).sort({createdAt : -1}).limit(5).then(foundlist=>{
     const recentItem = []
     foundlist.forEach(function(items){
       items.items.forEach(function(item){
           recentItem.push(item)
       })
})
      res.render('home', { incomeAmounts, expenseAmounts, average ,Items : recentItem});
   }).catch(err=>{
     console.log(err);
   })

 } catch (err) {
   res.status(500).send(err);
 }

})
app.get('/add-income',async(req,res)=>{
  let totalIncome = 0;
  const incomeItems = []
  User.find({name:username}).then(foundItems =>{
    foundItems.forEach(function(items){
      items.items.forEach(function(item){
        if(item.type ==="Income"){
          totalIncome = totalIncome + item.amount;
          incomeItems.push(item)
        }
      })

      res.render("income",{ItemList : incomeItems,totalIncome:totalIncome})
      })
  }).catch(err =>{
    console.log("Fetching Error:"+err)
  })

})
app.get('/add-expense',function(req,res){
  let totalExpense = 0;
  const expenseItems = []
  User.find({name:username}).then(foundItems =>{
    foundItems.forEach(function(items){
      items.items.forEach(function(item){
        if(item.type === "Expense"){
          totalExpense = totalExpense + item.amount;
          expenseItems.push(item)
        }
      })
      })
      res.render("expense",{ItemList : expenseItems,totalExpense :totalExpense})
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
    res.redirect("/home")
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
    type : "Income"
  })
  if(!title || !amount || !desc ||!date){
    res.status(400).send("All fields are required")
  }
  else if(amount<=0 || amount=='number'){
    res.status(400).send("Enter a valid amount")
  }else{
    incomeItem.save();
    User.findOne({name:username}).then(foundlist=>{
      foundlist.items.push(incomeItem);
      foundlist.save();
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
  console.log(title,amount,desc,date)
  const expenseItem = new Expense({
    title : title,
    amount : amount,
    description : desc,
    date : date,
    type : "Expense"
  })
  if(!title || !amount || !desc ||!date){
    res.status(400).send("All fields are required")
  }
  else if(amount<=0 || amount=='number'){
    res.status(400).send("Enter a valid amount")
  }else{
    expenseItem.save();
    User.findOne({name:username}).then(foundlist=>{
      foundlist.items.push(expenseItem);
      foundlist.save();
      res.redirect("/add-expense")
    }).catch(err=>{
      console.log(err);
    })

    expCol.deleteMany({});
  }
})
app.post('/Item/:ItemId/',function(req,res){
  let id = req.params.ItemId;
  let type = req.body.button;
  console.log(req.body)
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
})



let port = process.env.PORT;
if(port== null||port==""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully")
})
