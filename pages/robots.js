import Head from 'next/head'
import fetch from 'node-fetch'
import { useState } from 'react'

export async function getServerSideProps(context) {
  const BACKEND_URL = process.env.BACKEND
  const {TOKEN_KVESTGID} = process.env

  const options = {
    headers: {
      cookie: context.req.headers.cookie
    }
  }

  const user_response = await fetch(BACKEND_URL + '/api/auth', options)
  const robot_game_response = await fetch(BACKEND_URL + `/api/robot_game?code=${context.query.code}&load_robot=1&token=${TOKEN_KVESTGID}`)

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
    robots = robot_game.robots.map(robot_config => {
      const robot = robot_config._robot
      robot.is_selected = !!robot_config.player_code
      return robot
    })
  }


  return {
    props: {
      robots,
      user,
      robot_game: robot_game ? {
        name: robot_game.name,
        state: robot_game.state,
        count: robot_game.count,
        code: robot_game.code,
        players_count: robot_game.players.length
      } : null
    }
  }
}

export default function Robots(props) {

  const { robot_game } = props;
  if (!robot_game) {
    return <div>Игра не найдена. Свяжитесь с адмнистратором....</div>
  }

  const [player_code, setPlayerCode] = useState();

  const show_btn = robot_game.state === 'activated' && (player_code || !robot_game.players_count)
  const show_init = robot_game.state === 'inited'
  const show_closed = robot_game.state === 'closed'
  const show_player_code_form = !!(robot_game.state == 'activated' && robot_game.players_count)

  return <div className="container">
    <Head>
      <title>Выберите робота</title>
    </Head>

    <div className="pt-5 pb-3">
      <h1>Выберите робота...</h1>
    </div>

    <p>Команда: {robot_game.name}. Игра забронирована на {robot_game.count} человек.</p>
    {show_init && <p>Игра еще не началась. Что бы быть готовым к битве попробуйте <a href="/wartec/demo">симулятор управления роботом</a></p>}
    {show_closed && <div className="alert alert-danger">Игра закончилась. Ждем вас снова!</div>}
    {show_player_code_form && <form className="form">
      <div className="form-group">
        <input className="form-control"
          type="text"
          placeholder="Для продолжения введите Ваш код игрока"
          value={player_code}
          onChange={event => setPlayerCode(event.target.value)} />
      </div>
    </form>}
    <div className="row">
      {
        props.robots.map(robot =>
          <div className="col-12 col-lg-4 mb-4" key={robot._id}>
            <RobotCard
              robot={robot}
              show_btn={show_btn}
              player_code={player_code}
              code={robot_game.code} />
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

function RobotCard({ robot, show_btn, code, player_code }) {
  return <div className="card bg-dark">
    <svg
      className="bd-placeholder-img card-img-top"
      width="100%" height="180"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
      role="img"
      aria-label="Placeholder: Image cap">
      <title>Placeholder</title>
      <rect width="100%" height="100%" fill="#868e96"></rect>
      <text x="50%" y="50%" fill="#dee2e6" dy=".3em">Image cap</text>
    </svg>
    <div className="card-body text-center">
      <h4 className="card-title">{robot.name}</h4>
      <p className="card-text">{robot.description}</p>
      {show_btn && <a
        href={`/?code=${code}&_robot=${robot._id}${player_code ? `&player_code=${player_code}` : ''}`}
        className={`btn btn-${robot.is_selected ? 'secondary' : 'primary'}`}>{robot.is_selected ? 'Выбран' : 'Выбрать'}</a>}
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