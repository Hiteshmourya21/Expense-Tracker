
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
 mongoose.connect('mongodb+srv://Hitesh:0zwKN11GryRsdbQr@cluster0.l5jm2ax.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect('mongodb://localhost:27017/myExpenseTracker', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

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
   const data1 = await Expense.find({type:"Income"}).lean();
   const data2 = await Expense.find({type:"Expense"}).lean();

   const prices1 = data1.map(item => item.amount);
   const prices2 = data2.map(item => item.amount);
   const averages = calculateAverages(prices1, prices2);

   Expense.find().sort({createdAt : -1}).limit(5).then(foundItems =>{
       res.render('home', { prices1, prices2, averages ,Items : foundItems});
   }).catch(err=>{
     console.log("Fetching Error:"+err)
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
    const defaultIncomeItem = new Expense({
      title : "Default",
      amount : 0,
      description : "Deafult Item",
      date :  new Date('2024-02-21T00:00:00.000Z'),
      type : "Income"
    })
    const defaultExpenseItem = new Expense({
      title : "Default",
      amount : 0,
      description : "Deafult Item",
      date :  new Date('2024-02-21T00:00:00.000Z'),
      type : "Expense"
    })
    const newUser = new User({
      name : name,
      password:p1,
      items : [defaultIncomeItem,defaultExpenseItem]
    })
    newUser.save()
    username = name;
    res.redirect("/")
  }
})
app.post("/Login",function(req,res){
  const password = req.body.password;
  const name = req.body.UserName;

  User.findOne({name:name,password:password}).then(foundItem=>{
    username = name
    res.redirect("/")
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


  }
})
app.post('/Item/:ItemId',function(req,res){
  let id = req.params.ItemId;
  User.updateOne(
    {name:username},
    {$pull:{items:{_id :id }}}
  )
.then(()=>{
  res.redirect("/")
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
