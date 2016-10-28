var express = require("express");
var app = express();
var http = require('http').Server(app);
var bodyParser=require("body-parser");
var mongojs = require("mongojs");
var router = express.Router();
var fs= require("fs");
var flash = require("req-flash");
var cookieParser = require('cookie-parser');
var session = require("express-session");
var md5 = require("MD5");
var pdf = require('html-pdf');
var db = mongojs("siakad",["event","absensimurid","absensiguru","datanilai","dataguru","datamurid","datakelas","user","matpel","jadwalmatpel"]);
var jwt = require('jsonwebtoken');
var wkhtmltopdf = require('wkhtmltopdf');
var token = jwt.sign({ foo: 'bar' }, 'shhhhh');
var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
 var mongoXlsx = require('mongo-xlsx');
var multer = require("multer");
var helmet = require('helmet');
var compression = require("compression");
var onesignal = require('node-opensignal-api');
var onesignal_client = onesignal.createClient();

var userAuthKey = 'b13642cc-128c-41db-aae5-014818246921';
onesignal_client.apps.viewall(userAuthKey, function (err, response) {
    if (err) {
        console.log('Encountered error', err);
    } else {
        console.log(response);
    }
});
app.use(helmet());
app.disable('x-powered-by');
app.use(compression());
var smtpConfig = {
      service:'Gmail', // use SSL
   auth: {
       user: 'smaitaltechno@gmail.com',
       pass: 'mutiaragading12'
   },
   tls:{
          rejectUnauthorized: false
      }
    };
    var transporter = nodemailer.createTransport(smtpConfig);

app.set('view engine', 'jade');
app.set('view engine', 'ejs');
app.use('/bootstrap',express.static(__dirname + '/bootstrap'));
app.use(express.static(__dirname + '/views'));
app.use('/public',express.static(__dirname + '/public'));
app.use('/gambarmurid',express.static(__dirname + '/gambarmurid'));
app.use('/node_modules',express.static(__dirname + '/node_modules'));
app.use('/gambaruser',express.static(__dirname + '/gambaruser'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(session({
  secret: 'siakad menggunakan mean',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))
app.use(cookieParser());
app.use(flash());
router.post("/pross_login",function(request,response){
var email = request.body.email;
var password = md5(request.body.password);
 db.user.findOne({email:email,password:password},function(err, results){
if( results != null){
  if(results.lenght){
  response.redirect("/");
}else{
      // Store the user's primary key
      // in the session store to be retrieved,
      // or in this case the entire user object
      request.session.foto = results.foto;
      request.session.nama = results.nama;
      request.session.level = results.level;
      request.session.kelas = results.kelas;
  response.redirect("/home");

}
}else{
  request.flash('errorMessage', 'Username atau password anda salah');
  response.redirect("/");
}

});
});
router.get("/logout",function(req,res){
  req.session.destroy(function(err) {
  // cannot access session here
});
res.redirect("/");
});
router.get("/home",function(req,res){
  if(req.session.nama==undefined){
    res.redirect("/");
  }else{
    res.render("home.jade",{nama:req.session.nama,gambar:req.session.foto,level:req.session.level});
  }
});
router.get("/",function(req,res){
  res.render("index.jade",{pesan:req.flash("errorMessage")})
});
router.get("/dataguru",function(req,res){
  res.render("dataguru.jade",{level:req.session.level});
});
router.get("/nilai",function(req,res){
  res.render("nilai.jade",{level:req.session.level});
});
router.get("/datamurid",function(req,res){
  res.render("datamurid.jade",{level:req.session.level});
});
router.get("/jadwalpel",function(req,res){
  res.render("jadwalmatpel.jade",{level:req.session.level});
});
router.get("/event",function(req,res){
  res.render("event.jade",{level:req.session.level});
});
router.get("/absensimurid",function(req,res){
  res.render("absensimurid.jade",{level:req.session.level});
});
router.get("/ambil_dataguru",function(req,res){
  db.dataguru.find(function(err,docs){
    res.json(docs)
  })
});
router.get("/datakelas",function(req,res){
  res.render("datakelas.jade",{level:req.session.level});
});
router.get("/absensiguru",function(req,res){
  res.render("absensiguru.jade",{level:req.session.level});
});
router.get("/user",function(req,res){
  res.render("user.ejs",{level:req.session.level});
});
router.get("/datamatpel",function(req,res){
  res.render("matpel.jade");
});
router.post("/simpan_dataguru",function(req,res){
  db.dataguru.insert(req.body,function(err,docs){
  })
   db.absensiguru.insert({nama:req.body.nama,izin:0,sakit:0,alfa:0,masuk:0},function(err,docs){
  })
   res.end()
})
router.get("/ambil_dataevent",function(req,res){
  db.event.find(function(err,docs){
    res.json(docs)
  });
});
router.post("/simpan_event",function(req,res){
  db.user.find({level:'murid'},function(err,docs){
    for(var i = 0;i < docs.length;i++){
         var mailOptions = {
    from:"Admin Siakad<juancesarandrianto@gmail.com>", // sender address
    to: docs[i].email, // list of receivers
    subject: 'Pemberitahuan Event '+req.body.nama, // Subject line
    text:"========================================= Siakad=============================",
    html:'berikut ini adalah event yang di adakan di sekolah<br>tempat: '+req.body.tempat+'<br>tanggal: '+req.body.tanggal+'<br>keterangan lengkap: '+req.body.keterangan
}
transporter.sendMail(mailOptions, function(error, info){
  if(error){
    console.log(error);
  }else{
  console.log('Message sent: ' + info.response);
}
    })
    }
  })
  db.event.insert(req.body,function(err,docs){
    res.end();
  });
});
router.post("/ubah_event",function(req,res){
  var id = req.body.id;
  db.event.update({ _id:mongojs.ObjectId(id)},{nama:req.body.nama,tempat:req.body.tempat,keterangan:req.body.keterangan,tanggal:req.body.tanggal},function(err,docs){
    res.end();
  })
});
router.post("/hapus_event",function(req,res){
  var id = req.body.id.hapusevent;
  for(var i = 0;i < id.length;i++){
    db.event.remove( {_id: mongojs.ObjectId(id[i])},1);
  };
  res.json()
});

router.post("/ubah_dataguru",function(req,res){
  var id = req.body.id;
db.dataguru.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:req.body},new:true},function(err,doc){
res.json(doc);
});
});
router.get("/ambil_datanilai",function(req,res){
  if(req.session.level=='guru'){
  db.datanilai.find({kelas:req.session.kelas},function(err,docs){
    res.json(docs);
  });
}else{
   db.datanilai.find(function(err,docs){
    res.json(docs);
  });
}
});
router.post("/tambah_datanilai",function(req,res){
  db.datanilai.insert(req.body,function(err,docs){
    res.json(docs)
  })
})
router.post("/hapus_guru",function(req,res){
  var id = req.body.id.hapusguru;
  for(var i = 0;i < id.length;i++){
    db.dataguru.remove( {_id: mongojs.ObjectId(id[i])},1);
  };
  res.json()
});
router.post("/nonaktif_guru",function(req,res){
  var id = req.body.id.hapusguru;
  for(var i = 0;i < id.length;i++){
    db.dataguru.findAndModify({query:{_id:mongojs.ObjectId(id[i])},
    update:{$set:{status:"tidak aktif"}},new:true},function(err,doc){
    });
  };
  res.json();
});
router.get("/ambil_datamurid",function(req,res){
  db.datamurid.find(function(err,docs){
    res.json(docs);
  });
})
var storage = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, './gambarmurid/');
  },
  filename: function (request, file, callback) {
    console.log(file);
    callback(null, file.originalname)
  }
});
var upload = multer({storage: storage}).single('foto');
  router.post("/tambah_murid",function(request,response){
    upload(request, response, function(err) {
    db.datamurid.insert({
      nama:request.body.nama,
      email:request.body.email,
      kelas:request.body.kelas,
      alamat:request.body.alamat,
      notlp:request.body.notlp,
      foto:"gambarmurid/"+request.file.originalname,
      tempat:request.body.tempat,
      tanggal:request.body.tanggal,
      status:request.body.status
    },function(err,docs){
    })
    db.absensimurid.insert({nama:request.body.nama,kelas:request.body.kelas,alfa:0,izin:0,sakit:0,masuk:0});
  if(err) {
    console.log('Error Occured');
    return;
  }
  console.log(request.file);
  response.end('Your File Uploaded');
  console.log('Photo Uploaded');
});
});
router.post("/ubah_datamurid",function(request,response){
  var storage = multer.diskStorage({
    destination: function (request, file, callback) {
      callback(null, './gambarmurid/');
    },
    filename: function (request, file, callback) {
      console.log(file);
      callback(null, file.originalname)
    }
  });
  var upload = multer({storage: storage}).single('foto');
  upload(request, response, function(err) {
    var id = request.body.id;
    console.log(id);
  db.datamurid.findAndModify({query:{_id:mongojs.ObjectId(id)},
  update:{$set:{
    nama:request.body.nama,
    email:request.body.email,
    kelas:request.body.kelas,
    alamat:request.body.alamat,
    notlp:request.body.alamat,
    foto:"gambarmurid/"+request.file.originalname,
    tempat:request.body.tempat,
    tanggal:request.body.tanggal,
    status:request.body.status
    }},new:true},function(err,doc){
  });
  if(err) {
    console.log('Error Occured');
    return;
  }
  console.log(request.file);
  response.end('Your File Uploaded');
  console.log('Photo Uploaded');
});
});
router.post("/hapus_murid",function(req,res){
  var id = req.body.id.hapusmurid;
  for(var i = 0;i < id.length;i++){
    fs.unlink(id[i].foto);
    db.datamurid.remove( {_id: mongojs.ObjectId(id[i]._id)},1);
  }
  res.json();
});
router.post("/nonaktif_murid",function(req,res){
  var id = req.body.id.hapusmurid;
  for(var i = 0;i < id.length;i++){
    db.datamurid.findAndModify({query:{_id:mongojs.ObjectId(id[i]._id)},
    update:{$set:{status:"tidak aktif"}},new:true},function(err,doc){
    });
  }
  res.json();
});
router.post("/ubah_datamuridnoimage",function(req,res){
  var id = req.body.id;
db.datamurid.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:req.body},new:true},function(err,doc){
res.json(doc);
});
});
router.get("/ambil_datakelas",function(req,res){
  db.datakelas.find(function(err,docs){
    res.json(docs);
  });
});
router.post("/tambah_kelas",function(req,res){
  db.datakelas.insert(req.body,function(err,docs){
    res.json()
  });
});
  router.post("/ubah_datakelas",function(req,res){
    var id = req.body.id;
    db.datakelas.findAndModify({query:{_id:mongojs.ObjectId(id)},
    update:{$set:req.body},new:true},function(err,doc){
    res.json(doc);
    });
  });
  router.post("/hapus_kelas",function(req,res){
    var id = req.body.id.hapuskelas;
    for(var i = 0;i < id.length;i++){
      db.datakelas.remove( {_id: mongojs.ObjectId(id[i])},1);
    }
    res.json();
  });
  router.get("/ambil_datauser",function(req,res){
    db.user.find(function(err,docs){
      res.json(docs);
    });
  });
  router.post("/tambah_user",function(request,response){
    var storage = multer.diskStorage({
      destination: function (request, file, callback) {
        callback(null, './gambaruser/');
      },
      filename: function (request, file, callback) {
        console.log(file);
        callback(null, file.originalname)
      }
    });
    var upload = multer({storage: storage}).single('foto');
    upload(request, response, function(err) {
      var password = md5(request.body.password)
    db.user.insert({
      nama:request.body.nama,
      email:request.body.email,
      password:password,
      level:request.body.level,
      foto:"gambaruser/"+request.file.originalname,
      kelas:request.body.kelas,
      passwordasli:request.body.password
      },function(err,doc){
    });
    if(err) {
      console.log('Error Occured');
      return;
    }
    console.log(request.file);
    response.json();
    console.log('Photo Uploaded');
    });
  });
  router.post("/ubah_datauser",function(request,response){
    var storage = multer.diskStorage({
      destination: function (request, file, callback) {
        callback(null, './gambaruser/');
      },
      filename: function (request, file, callback) {
        console.log(file);
        callback(null, file.originalname)
      }
    });
    var upload = multer({storage: storage}).single('foto');
    upload(request, response, function(err) {
      var id = request.body.id;
      var password = md5(request.body.password)
    db.user.findAndModify({query:{_id:mongojs.ObjectId(id)},
    update:{$set:{
      nama:request.body.nama,
      email:request.body.email,
      password:password,
      level:request.body.level,
      foto:"gambaruser/"+request.file.originalname,
      passwordasli:request.body.password
          }},new:true},function(err,doc){
    });
    if(err) {
      console.log('Error Occured');
      return;
    }
    console.log(request.file);
    response.end('Your File Uploaded');
    console.log('Photo Uploaded');
  });
  });
  router.post("/hapus_user",function(req,res){
    var id = req.body.id.hapususer;
    for(var i = 0;i < id.length;i++){
      fs.unlink(id[i].foto);
      db.user.remove( {_id: mongojs.ObjectId(id[i]._id)},1);
    }
    res.json();
  });
  router.post("/ubah_datausernoimage",function(req,res){
    var id = req.body.id;
    var password = md5(req.body.password);
    db.user.findAndModify({query:{_id:mongojs.ObjectId(id)},
    update:{$set:{nama:req.body.nama,email:req.body.email,level:req.body.level,kelas:req.body.kelas,password:password,passwordasli:req.body.password}},new:true},function(err,doc){
    res.json(doc);
  });
})
router.get("/ambil_matpel",function(req,res){
  db.matpel.find(function(err,docs){
    res.json(docs)
  })
});
router.post("/tambah_matpel",function(req,res){
  db.matpel.insert(req.body,function(err,docs){
    res.json(docs)
  });
});
router.post("/ubah_datamatpel",function(req,res){
  var id = req.body.id;
db.matpel.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{nama:req.body.nama,email:req.body.email,level:req.body.level,kelas:req.body.kelas}},new:true},function(err,doc){
res.json(doc);
});
});
router.post("/hapus_matpel",function(req,res){
  var id = req.body.id.hapusmatpel;
  for(var i = 0;i < id.length;i++){
    db.matpel.remove( {_id: mongojs.ObjectId(id[i])},1);
  }
  res.json();
});
router.get("/ambil_jadwalmatpel",function(req,res){
   if(req.session.level=='guru'){
  db.jadwalmatpel.find({guru:req.session.nama},function(err,docs){
    res.json(docs);
  });
}else if(req.session.level=='murid'){
  db.jadwalmatpel.find({kelas:req.session.kelas},function(err,docs){
    res.json(docs);
  });
}else{
  db.jadwalmatpel.find(function(err,docs){
    res.json(docs);
  });
}
});
router.post("/tambah_jadwalmatpel",function(req,res){
  db.jadwalmatpel.insert(req.body,function(err,docs){
    res.json(docs);
  });
});
router.get("/ambil_absensimurid",function(req,res){
  db.absensimurid.find(function(err,docs){
    res.json(docs)
  })
})
router.post("/insert_absensimurid",function(req,res){
 var id = req.body.id;
if(req.body.keterangan=="izin"){ 
  var counter = 1;
  db.absensimurid.findOne({_id:mongojs.ObjectId(id)},function(err,docs){
    counter += docs.izin;
      db.absensimurid.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{izin:counter}},new:true},function(err,doc){
})
  })
}else if(req.body.keterangan=="alfa"){
  var counter = 1;
  db.absensimurid.findOne({_id:mongojs.ObjectId(id)},function(err,docs){
    counter += docs.alfa;
      db.absensimurid.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{alfa:counter}},new:true},function(err,doc){
})
  })
}else if(req.body.keterangan=="sakit"){
 var counter = 1;
  db.absensimurid.findOne({_id:mongojs.ObjectId(id)},function(err,docs){
    counter += docs.sakit;
      db.absensimurid.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{sakit:counter}},new:true},function(err,doc){
})
  })
}else{
  var counter = 1;
  db.absensimuridb.findOne({_id:mongojs.ObjectId(id)},function(err,docs){
    counter += docs.masuk;
      db.absensimurid.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{masuk:counter}},new:true},function(err,doc){
})
  })
}
res.end();
});
router.post("/ubah_absensimurid",function(req,res){
  var id = req.body.id;
db.absensimurid.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{nama:req.body.nama,kelas:req.body.kelas,keterangan:req.body.keterangan}},new:true},function(err,doc){
res.json(doc);
});
});
router.post("/savetopdf",function(req,res){
  var template = res.render("jadwalmatapelajaran.ejs");
  wkhtmltopdf.command = 'c:/Program Files/wkhtmltopdf/bin/wkhtmltopdf.exe';
  wkhtmltopdf("http://localhost:3000/matapelpdf", {
    pageSize: 'letter'
  })
    .pipe(fs.createWriteStream('cetakjadwalpelajaran/jadwalpelajaran.pdf'));
res.end();
});
router.post("/cetaklaporanabsensiguru",function(req,res){
db.absensiguru.find(function(err,docs){
/* Generate automatic model for processing (A static model should be used) */
var model = mongoXlsx.buildDynamicModel(docs);
/* Generate Excel */
mongoXlsx.mongoData2Xlsx(docs, model, function(err, docs) {
console.log('File saved at:', docs.fullPath); 
});  
res.end()
});
});
router.post("/cetaklaporanabsensimurid",function(req,res){
db.absensiguru.find(function(err,docs){
/* Generate automatic model for processing (A static model should be used) */
var model = mongoXlsx.buildDynamicModel(docs);
/* Generate Excel */
mongoXlsx.mongoData2Xlsx(docs, model, function(err, docs) {
console.log('File saved at:', docs.fullPath); 
});  
res.end()
});
});
router.get("/matapelpdf",function(req,res){
  if(req.session.level=='guru'){
  db.jadwalmatpel.find({guru:req.session.nama},function(err,docs){
    console.log(docs);
    res.render("jadwalmatapelajaran.jade",{data:docs});
  });
}else{
  db.jadwalmatpel.find(function(err,docs){
    console.log(docs);
    res.render("jadwalmatapelajaran.jade",{data:docs});
  });
}
});
router.post("/hapus_absenmurid",function(req,res){
  var id = req.body.id.hapusabsensimurid;
  for(var i = 0;i < id.length;i++){
    db.absensimurid.remove( {_id: mongojs.ObjectId(id[i])},1);
  }
res.end();
});
router.get("/daftar_user",function(req,res){
  res.render("register.jade");
});
router.get("/forgot_password",function(req,res){
  res.render("forgotpassword.jade");
});
router.post("/pross_forgot",function(req,res){
  db.user.findOne({email:req.body.email},function(err,docs){
    console.log(docs);
    if(docs==undefined){
      res.redirect("/forgot_password");
    }else{
    var mailOptions = {
    from:"Admin Siakad<juancesarandrianto@gmail.com>", // sender address
    to: req.body.email, // list of receivers
    subject: 'Forgot password', // Subject line
    text:"========================================= Siakad=============================",
    html:'berikut ini adalah password anda adalah <strong>'+docs.passwordasli+'</strong>'
}
transporter.sendMail(mailOptions, function(error, info){
  if(error){
    console.log(error);
  }else{
  console.log('Message sent: ' + info.response);
}
      res.redirect("/");
    })
};
  })
})
router.post("/pross_register",function(req,res){
  var password = md5(req.body.password);
  db.datamurid.findOne({email:req.body.email},function(err,docs){
    console.log(docs)
    if(docs==null){
      res.redirect("/daftar_user");
    }else{
  db.user.insert({nama:docs.nama,kelas:docs.kelas,password:password,email:req.body.email,foto:docs.foto,passwordasli:req.body.password,level:"murid"},function(err,docs){
  })
  res.redirect("/")  
    }
  });
})
router.post("/ubah_jadwalmatpel",function(req,res){
  var id = req.body.id;
db.jadwalmatpel.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{hari:req.body.hari,tanggal:req.body.tanggal,kelas:req.body.kelas,matpel:req.body.matpel,guru:req.body.guru}},new:true},function(err,doc){
res.json(doc);
});
})
router.post("/hapus_jadwalmatpel",function(req,res){
  var id = req.body.id.hapusjadwalmatpel;
  for(var i = 0;i < id.length;i++){
    db.jadwalmatpel.remove( {_id: mongojs.ObjectId(id[i])},1);
  }
  res.json();
});
router.post("/ubah_datanilai",function(req,res){
  var id = req.body.id;
db.datanilai.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{nama:req.body.nama,kelas:req.body.kelas,matpel:req.body.matpel,uts:req.body.uts,uas:req.body.uas,jumlahnilai:req.body.jumlahnilai}},new:true},function(err,doc){
res.json(doc);
});
});

router.post("/hapus_nilai",function(req,res){
  var id = req.body.id.hapusnilai;
  for(var i = 0;i < id.length;i++){
    db.datanilai.remove( {_id: mongojs.ObjectId(id[i])},1);
  }
  res.end();
})

router.get("/ambil_absensiguru",function(req,res){
  db.absensiguru.find(function(err,docs){
    res.json(docs);
  });
});
router.post("/tambah_absensiguru",function(req,res){
  
  var id = req.body.id;
if(req.body.keterangan=="izin"){ 
  var counter = 1;
  db.absensiguru.findOne({_id:mongojs.ObjectId(id)},function(err,docs){
    counter += docs.izin;
      db.absensiguru.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{izin:counter}},new:true},function(err,doc){
})
  })
}else if(req.body.keterangan=="alfa"){
  var counter = 1;
  db.absensiguru.findOne({_id:mongojs.ObjectId(id)},function(err,docs){
    counter += docs.alfa;
      db.absensiguru.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{alfa:counter}},new:true},function(err,doc){
})
  })
}else if(req.body.keterangan=="sakit"){
 var counter = 1;
  db.absensiguru.findOne({_id:mongojs.ObjectId(id)},function(err,docs){
    counter += docs.sakit;
      db.absensiguru.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{sakit:counter}},new:true},function(err,doc){
})
  })
}else{
  var counter = 1;
  db.absensiguru.findOne({_id:mongojs.ObjectId(id)},function(err,docs){
    counter += docs.masuk;
      db.absensiguru.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{masuk:counter}},new:true},function(err,doc){
})
  })
}
res.end();
})
router.post("/ubah_absensiguru",function(req,res){
  var id = req.body.id;
db.absensiguru.findAndModify({query:{_id:mongojs.ObjectId(id)},
update:{$set:{nama:req.body.nama,keterangan:req.body.keterangan}},new:true},function(err,doc){
})
res.end();
})
router.post("/hapus_absensiguru",function(req,res){
  var id = req.body.id.hapusabsensiguru;
  for(var i = 0;i < id.length;i++){
    db.absensiguru.remove( {_id: mongojs.ObjectId(id[i])},1);
  }
  res.end();
})
app.use('/',router);
http.listen(3000);
