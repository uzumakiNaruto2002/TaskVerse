const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemsSchema = {
    name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
})

const item2 = new Item({
    name: "Hit the + button to add new item."
})

const item3 = new Item({
    name: "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {

    Item.find({}).then((result) => {
        if(result.length === 0){
            Item.insertMany(defaultItems).then((result) => {
                console.log('Insertion successful:');
            }).catch((error) => {
                console.error('Insertion failed:', error);
            });
            res.redirect("/");
        }
        else{
            res.render('list', { listTitle: "Today", newListItems: result });
        }
    })
})

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then((result) => {
        if(!result){
            const list = new List({
                name: customListName,
                items: defaultItems
            })
        
            list.save();
            res.redirect("/" + customListName);
        }
        else{
            res.render('list', { listTitle: result.name, newListItems: result.items });
        }
    })
})

app.post("/", (req, res) => {
    const newItem = req.body.newItem;
    const newList = req.body.list;

    const item = new Item({
        name: newItem
    })

    if(newList === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: newList}).then((result) => {
            result.items.push(item);
            result.save();
            res.redirect("/" + newList);
        })
    }
})

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findOneAndDelete({_id: checkedItemId}).then((removedDocument) => {
            if (removedDocument) {
              console.log('Document removed successfully:');
              res.redirect("/")
            }
        })
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then((result) =>{
            if(result){
                res.redirect("/" + listName);
            }
        })
    }
})

app.get("/work", (req, res) => {
    res.render('list', { listTitle: "Work List", newListItems: workItems });
})

app.post("/work", (req, res) => {
    var item = req.body.newItem;
    workItems.push(item);
    res.redirect("/work");
})

app.listen(5000, () => {
    console.log("Server started on port 3000");
})