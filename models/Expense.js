const mongoose  = require("mongoose")
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
    maxLength : 6
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

module.exports = expenseSchema;
