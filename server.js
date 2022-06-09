import express from 'express'
import cors from 'cors'
import knex from 'knex'
import bcrypt from 'bcrypt-nodejs'
import Clarifai from 'clarifai'




const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'sparty20',
        database: 'postgres',
        port: '5432'
    }
});

db.select('*').from('users').then(data => console.log(data))

const app = express()


app.use(express.json())
app.use(cors())

app.get('/', (req, res) =>
    res.send('success')
)
app.post('/signin', (req, res) => {
    const { email, password } = req.body
    db.select('email', 'hash').from('login').where('email', '=', email)
        .then(data => {
            if (!email || !password) {
                return res.status(400).json('incorrect form submission')
            }
            const isValid = bcrypt.compareSync(password, data[0].hash)
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', email)
                    .then(user => {
                        res.json(user[0])
                    })
                    .catch(err => res.status(400).json('Unable to get user'))
            }
            else { res.status(400).json('Wrong Credentials') }

        })
        .catch(err => res.status(400).json('Wrong credentials'))
}
)
app.post('/register', (req, res) => {
    const { email, name, password } = req.body
    if (!email || !name || !password) {
        return res.status(400).json('incorrect form submission')
    }
    const hash = bcrypt.hashSync(password)
    return db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: email,
                        name_user: name,
                        joined: new Date()
                    })
                    .then(user => {
                        res.json(user[0])
                    })
            })
            .then(trx.commit)
            .catch(trx.rollback)
    })

        .catch(err => res.status(400).json('Name or Email already exists'))

}

)
app.get('/profile/:id', (req, res) => {
    const { id } = req.params
    db.select('*').from('users').where({ id })
        .then(user => {
            if (user.length) {
                res.json(user[0])
            }
            else {
                res.status(400).json('User not Found')
            }

        })
        .catch(err => res.status(400).json('Error getting user'))
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0].entries)
        })
        .catch(err => {
            res.status(400).json('Unable to get entries')
        })
})



app.post('/imageUrl', (req, res) => {
const appApi = new Clarifai.App({
    apiKey: 'da590abc3c674f8ca2469d32a157d3a7'
});
appApi.models.predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
.then(data=>{
    res.json(data)
})
.catch(err=>res.status(400).json('unable to work with API'))

})

app.listen(3001, () => {
    console.log('app is running')
})