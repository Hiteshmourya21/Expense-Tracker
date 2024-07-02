const mongoose  = require("mongoose")
const expenseSchema = require("./Expense")
const remainderSchema = require("./Remainder")

const UserSchema = new mongoose.Schema({
  name: { type: String,
     required: true,
     unique: true
    },
  password: { type: String,
     required: true
    },
  money : {
      type: Number,
      default : 0
    },
  limit : {
      type:Number,
      default : 0
    },
  remainder :[remainderSchema],
  items: [expenseSchema]
}, {timestamps:true});

const User = mongoose.model("User",UserSchema)
module.exports = User;
