const mongoose  = require("mongoose")
const expenseSchema = require("./Expense")

const UserSchema = new mongoose.Schema({
  name: { type: String,
     required: true,
     unique: true
    },
  password: { type: String,
     required: true
    },
  items: [expenseSchema]
}, {timestamps:true});

const User = mongoose.model("User",UserSchema)
module.exports = User;
