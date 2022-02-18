// get package express
const express = require('express')
// set package express
const app = express()

// Import package bcrypt
const bcrypt = require('bcrypt')

// import package express-flash and express-session
const flash = require('express-flash')
const session = require('express-session')

// import db connection
const db = require('./connection/db')

// set template engine ( view engine setup)
app.set('view engine','hbs')

// initialize dictinary
// app.use('/public', express.static( __dirname + '/public'))
app.use(express.static('public'))
app.use('/uploads', express.static(__dirname + '/uploads'))

// set url encoded for get on page 
app.use(express.urlencoded({extended: false}))

// set partials directory  
const hbs = require('hbs') 
hbs.registerPartials(__dirname + '/views')

// use express-flash
app.use(flash())

// setup session midleware
app.use(
    session({
        cookie: {
            maxAge: 1000 * 60 * 60 * 2,
            secure: false,
            httpOnly: true
        },
        store: new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret: "secretValue"
    })
)

// ############# SET END POINT ###############
// set redirect deafult to home page
app.get('/', (req, res)=>{
    res.redirect('home')
})
// get data to home page 
app.get('/home', (req, res)=>{
    let query

    if (req.session.onLogin){
        query = `SELECT tb_blog.id, projectname, startdate, enddate, duration, icontech, 
                    descript, image, name AS author FROM tb_blog INNER JOIN 
                    tb_user ON tb_user.id = tb_blog.author_id WHERE author_id = ${req.session.user.id}` 
    }else{
        query = `SELECT tb_blog.id, projectname, startdate, enddate, duration, icontech, 
                    descript, image, name AS author FROM tb_blog INNER JOIN 
                    tb_user ON tb_user.id = tb_blog.author_id` 
    }   
    db.connect((err, client, done)=>{
        if (err) throw err

        client.query(query , (err, result)=>{
            done()
            if (err) throw err
            let rest = result.rows;
            let data = rest.map((data)=>{
                return{
                    ...data,
                    android : data.icontech[0],
                    apple : data.icontech[1],
                    windows : data.icontech[2],
                    linux : data.icontech[3],
                    onLogin : req.session.onLogin  
                }
            })
            // console.log(data)
            res.render('index', { data,  
                onLogin: req.session.onLogin,
                user : req.session.user    
            })
        })
    })
})
// =========== EDIT PROJECT ================
// set page view update project
let editID = []
app.get('/updateproject/:id', (req, res)=>{
    const {id} = req.params
    editID.push(id)

    res.redirect('/edit')
})
app.get('/edit', (req, res)=>{
    if (editID[1]){
        editID.splice(0, 1)
    }
    let query = `SELECT projectname, TO_CHAR(startdate, 'YYYY/MM/DD')startdate,  
                    TO_CHAR(enddate, 'YYYY/MM/DD')enddate, duration, descript,
                    icontech, image FROM tb_blog WHERE id=${editID[0]}`

    db.connect((err, client, done)=>{
        if (err) throw err
        client.query(query, (err, result)=>{
            done()
            if (err) throw err
            let getData = result.rows
            let Data = getData.map((data)=>{
                return {
                    ...data,
                    android : data.icontech[0],
                    apple : data.icontech[1],
                    windows : data.icontech[2],
                    linux : data.icontech[3]
                }
            })
            console.log(Data);
            res.render('myproject-update', {Data, 
                onLogin : req.session.onLogin
            })
        })
    })
})
// SUBMIT UPDATE
app.post('/update', (req, res)=>{
    let {projectname, startdate, enddate, description, 
        android, apple, windows, linux, image} = req.body
    
    let duration = getDuration(startdate, enddate)

    let query = `UPDATE tb_blog SET projectname='${projectname}', startdate='${startdate}',
                enddate='${enddate}',duration='${duration}' ,descript='${description}', icontech='{${android},${apple},${windows},${linux}}',
                image='${image}' WHERE id=${editID[0]}`
    db.connect((err, client, done)=>{
        if (err) throw err
        client.query(query, (err, result)=>{
            done()
            if (err) throw err

            res.redirect('/home')
        })
    })
})
// ============ END ========================

// ========== DETAIL PROJECT ===============
let iD = []
app.get('/detail/:id', (req, res)=>{
    const {id} = req.params
    let onLogin = req.session.onLogin  
    iD.push(id)
    res.redirect('/detail')
})

app.get('/detail', (req, res)=>{
    if (iD[1]){
        iD.splice(0, 1)
    }
    let query = `SELECT projectname, TO_CHAR(startdate, 'DD Mon YYYY')startdate,  
                    TO_CHAR(enddate, 'DD Mon YYYY')enddate, duration, descript,
                    icontech, image FROM tb_blog WHERE id=${iD[0]}`

    db.connect((err, client, done)=>{
        if (err) throw err
        client.query(query, (err, result)=>{
            done()
            if (err) throw err
            let getData = result.rows
            let Data = getData.map((data)=>{
                return{
                    ...data,
                    android : data.icontech[0],
                    apple : data.icontech[1],
                    windows : data.icontech[2],
                    linux : data.icontech[3],
                    onLogin : req.session.onLogin  
                }
            })
            console.log(Data);
            res.render(`myproject-detail`, {Data, 
                    onLogin: req.session.onLogin
                })          
        })  
    })
})
// ========== END ========================== 

// ============= ADD Project ===============
// set page view my project
app.get('/addproject', (req, res)=>{
    res.render('myproject', { onLogin : req.session.onLogin})
})
// Post data project view to home page
app.post('/add', (req, res)=>{

    let { projectname, startdate, enddate, description, 
            android, apple, windows, linux, image} = req.body
     
    let data = {
        duration : getDuration(startdate, enddate),
        author : req.session.user.id
    }        

    let query = `INSERT INTO tb_blog ( author_id, projectname, startdate, enddate, duration, icontech, descript, image)
                VALUES ( ${data.author},'${projectname}',date '${startdate}', date '${enddate}', '${data.duration}',
                '{ ${android}, ${apple}, ${windows}, ${linux} }', '${description}', '${image}'
                )` 
    
    db.connect((err, client, done)=>{
        if (err) throw err

        client.query(query, (err, result)=>{
            done()
            if (err) throw err

            res.redirect('/home')           
        })
    })
})
// ============= End =======================
// ============ REGISTER ===================
// set register view
app.get('/register', (req, res)=>{
    res.render('register')
})
//  submit register
app.post('/regist', (req, res)=>{
    let {name, email, password} = req.body

    let hashPassword = bcrypt.hashSync(password, 10)

    let query = `INSERT INTO tb_user (name, email, password) VALUES
                    ('${name}', '${email}', '${hashPassword}')`

    db.connect((err, client, done)=>{
        if(err) throw err
        client.query(query,(err, result)=>{
            done()
            if(err) throw err
            req.flash('success', 'Registration Success')
            res.redirect('/login')
        })
    })
})
// ================ END ======================
// =========== LOGIN =============
//  set view login
app.get('/login', (req, res)=>{
    res.render('login')
})
// submit login
app.post('/login', (req, res)=>{
    let {email, password} = req.body
    let query = `SELECT * FROM tb_user WHERE email='${email}'`

    db.connect((err,client, done)=>{
        if(err) throw err
        client.query(query, (err, result)=>{
            done()
            if(err) throw err
            if (result.rowCount == 0){
                req.flash('warning', 'Sorry, We not have your data! Please register')
                res.redirect('/register')
            }else{   
                let data = result.rows[0]
                let correct = bcrypt.compareSync(password, data.password)
                if (correct){
                    req.session.onLogin = true
                    req.session.user = {
                        id: data.id,
                        email: data.email,
                        name: data.email
                    }
                    req.flash('welcome', 'Login Successfully')
                    res.redirect('/home')
                }else{
                    req.flash('error', 'Sorry, your password incorrect! Please try again')
                    res.redirect('/login')
                }
            }   
        })
    })
})
// ============= END ==============
// ========== LOGOUT ==============
app.get('/logout', (req, res)=>{
    req.flash('info', 'Thank you')
    res.redirect('/home')
})
app.get('/home', (req, res)=>{
    res.render('index')
    req.session.destroy()
})
// ========== END =================

// set page view contact
app.get('/contact', (req, res)=>{
    res.render('contact')
})
// set delete project by id
app.post('/delete/:id', (req, res) =>{
    const {id} = req.params

    db.connect((err, client, done)=>{
        if (err) throw err

        let query = `DELETE FROM tb_blog WHERE id = $1`
        
        client.query(query, [id], (err, result)=>{
            done()
            if (err) throw err

            res.redirect('/home')
            // console.log(result); 
        })
    })
})
// ########## END POINT #########################

// function for duration time
function  getDuration (startdate, enddate){
    let startDate = new Date(startdate)
    let endDate = new Date(enddate)
    // count distance date
    let year =  endDate.getFullYear() - startDate.getFullYear()
    let month = (endDate.getUTCMonth()+1) - ((startDate.getUTCMonth()+1))
    let day = endDate.getUTCDate() - startDate.getUTCDate()
    // get data duration    
    let {dataYear, dataMonth, dataDay} = ``
    if ( year >= 1 ){
        dataYear = `${year} Year `
    }else { dataYear = `` }
    if ( month >= 1 ){
        dataMonth = `${month} Month `
    }else { dataMonth = `` }
    if ( day >= 1 ){
        dataDay = `${day} Day `
    }else{ dataDay = `` }

    return (dataYear + dataMonth + dataDay)
}
// ====== SET DEFAULT PORT on LOCALHOST =========
const port = 5000
app.listen(port, ()=>{
    console.log('Server running')
})
// ====== END =================================== 