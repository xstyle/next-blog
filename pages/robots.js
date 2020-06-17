import Head from 'next/head'
import fetch from 'node-fetch'
const BACKEND_URL = process.env.BACKEND

export async function getServerSideProps(context) {

  const options = {
    headers: {
      cookie: context.req.headers.cookie
    }
  }
  const user_response = await fetch(BACKEND_URL + '/api/auth', options)
  const robot_game_response = await fetch(BACKEND_URL + `/api/robot_game?code=${context.query.code}&load_robot=1`)

  let robots = []
  let user = {}
  let robot_game = null


  if (user_response.status === 200) {
    user = await user_response.json()
  }

  if (robot_game_response.status === 200) {
    robot_game = (await robot_game_response.json())[0] || null
    
  }
  
  if (robot_game) {
    robots = robot_game.robots.map(robot => robot._robot)
  }

  return {
    props: {
      robots,
      user,
      robot_game
    }
  }
}

export default function Robots(props) {
  if (!props.robot_game) {
    return <div>Игра не найдена. Свяжитесь с адмнистратором....</div>
  }
  const show_btn = props.robot_game.state === 'activated'
  const show_init = props.robot_game.state === 'inited'
  const show_closed = props.robot_game.state === 'closed'

  return <div className="container">
    <Head>
      <title>Выберите робота</title>
    </Head>
    <div className="pt-5 pb-3">
      <h1>Выберите робота...</h1>
    </div>
    
    <p>Команда: { props.robot_game.name }. Игра забронирована на {props.robot_game.count} человек.</p>
    {show_init && <p>Игра еще не началась. Что бы быть готовым к битве попробуйте <a href="/wartec/demo">симулятор управления роботом</a></p>}
    {show_closed && <div className="alert alert-danger">Игра закончилась. Ждем вас снова!</div>}
    <div className="row">
      {
        props.robots.map(robot =>
          <div className="col-12 col-lg-4" key={robot._id}>
            <RobotCard robot={robot} show_btn={show_btn}/>
          </div>
        )
      }
    </div>
    <style jsx global>{`
      body {
        color: white;
        background-color: black;
      }
    `}</style>
  </div>
}

function RobotCard({ robot, show_btn }) {
  return <div className="card bg-dark">
    <svg className="bd-placeholder-img card-img-top" width="100%" height="180" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" focusable="false" role="img" aria-label="Placeholder: Image cap">
      <title>Placeholder</title>
      <rect width="100%" height="100%" fill="#868e96"></rect>
      <text x="50%" y="50%" fill="#dee2e6" dy=".3em">Image cap</text>
    </svg>
    <div className="card-body text-center">
      <h4 className="card-title">{robot.name}</h4>
      <p className="card-text">{robot.description}</p>
      {show_btn && <a href={robot.url} className="btn btn-primary">Выбрать</a>}
    </div>
    <style jsx>{`
      .bd-placeholder-img {
        font-size: 1.125rem;
        text-anchor: middle;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `}</style>
  </div>
}