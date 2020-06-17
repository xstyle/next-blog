import Head from 'next/head'
import fetch from 'node-fetch'
const BACKEND_URL = process.env.BACKEND

export async function getServerSideProps(context) {
  const response = await fetch(BACKEND_URL + '/api/robot')
  const options = {
    headers: {
      cookie: context.req.headers.cookie
    }
  }
  const user_response = await fetch(BACKEND_URL + '/api/auth', options)

  let robots = []
  let user = {}

  if (response.status === 200) {
    robots = await response.json()
  }

  if (user_response.status === 200) {
    user = await user_response.json()
  }

  return {
    props: {
      robots,
      user
    }
  }
}

export default function Robots(props) {
  return <div className="container">
    <Head>
      <title>Выберите робота</title>
    </Head>
    <div>{props.user.name}</div>
    <h1>Выберите робота</h1>
    <div className="row">
      {
        props.robots.map(robot =>
          <div className="col-12 col-lg-3" key={robot._id}>
            <RobotCard robot={robot} />
          </div>
        )
      }
    </div>
  </div>
}

function RobotCard({ robot }) {
  return <div className="card">
    <div className="card-body text-center">
      <h5 className="card-title">{robot.name}</h5>
      <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
      <a href="#" className="btn btn-primary">Выбрать</a>
    </div>
  </div>
}