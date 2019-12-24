const express = require("express");
var app = express();

app.get("/", (req,res) => {
    res.send("")
})

app.listen(3000,()=>console.log("Cake Man on 3000"))