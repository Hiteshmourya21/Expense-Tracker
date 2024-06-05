
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

const app = express();

app.use(bodyParser.urlencoded({extended : true}))
app.use(express.static("public"))
app.set("view engine",'ejs')

//DATABASE
mongoose.connect('mongodb+srv://Hitesh:0zwKN11GryRsdbQr@cluster0.l5jm2ax.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const expenseSchema = new mongoose.Schema({
  title:{
    type : String,
    required : true,
    trim : true,
    maxLength : 50
  },
  amount:{
    type : Number,
    required : true,
    trim : true,
    maxLength : 20
  },
  type:{
    type : String,
  },
  date:{
      type : Date,
      required : true,
  },
  description:{
      type : String,
      required : true,
      trim : true,
      maxLength : 200
    }
}, {timestamps:true});

const Expense = mongoose.model("Expense",expenseSchema);



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


app.get('/',async (req,res) =>{
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
app.get('/add-income',function(req,res){
  let totalIncome = 0;
  Expense.find({type:'Income'}).then(foundItems =>{
    foundItems.forEach(function(item){
      totalIncome = totalIncome + item.amount;
    })
    res.render("income",{incomeList : foundItems,totalIncome:totalIncome})
  }).catch(err =>{
    console.log("Fetching Error:"+err)
  })
})
app.get('/add-expense',function(req,res){
  let totalExpense = 0;
  Expense.find({type:'Expense'}).then(foundItems =>{
    foundItems.forEach(function(item){
      totalExpense = totalExpense + item.amount;
    })
    res.render("expense",{expenseList : foundItems,totalExpense:totalExpense})
  }).catch(err =>{
    console.log("Fetching Error:"+err)
  })
})
app.get('/Item/:ItemId',function(req,res){
  let reqID = req.params.ItemId;
  Expense.find().then(foundItems =>{
    foundItems.forEach(function(Item){
      if(reqID == Item.id){
        res.render("item",{Item : Item})
      }
    })
  }).catch(err =>{
    console.log("Fetching Error:"+err)
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
    res.redirect('/add-income')
  }

})
app.post("/add-expense",function(req,res){
  const title = req.body.expenseTitle;
  const amount = req.body.expenseAmount;
  const desc = req.body.expenseDesciption;
  const date = req.body.Date;

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
    res.redirect('/add-expense')
  }
})
app.post('/Item/:ItemId',function(req,res){
  let id = req.params.ItemId;

  Expense.findByIdAndDelete(id).then(foundItem=>{
    if(foundItem.type == "Income"){
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
