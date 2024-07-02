const mongoose  = require("mongoose")
const remainderSchema = new mongoose.Schema({
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
  date:{
      type : Date,
      required : true,
  },
  timer:{
      type : String,
      required : true,
    }
}, {timestamps:true});

module.exports = remainderSchema;
