import mongoose from 'mongoose';
const optionSchema=new mongoose.Schema({text:{type:String,required:true,trim:true},votes:{type:Number,default:0,min:0}},{_id:true});
const pollSchema=new mongoose.Schema({question:{type:String,required:true,trim:true,maxlength:300},description:{type:String,trim:true,maxlength:1000},options:{type:[optionSchema],validate:{validator:v=>v.length>=2, message:'A poll needs at least 2 options'}},isActive:{type:Boolean,default:true},createdAt:{type:Date,default:Date.now},updatedAt:{type:Date,default:Date.now}},{versionKey:false});
pollSchema.pre('save',function(next){this.updatedAt=new Date();next()});
export default mongoose.model('Poll',pollSchema);
