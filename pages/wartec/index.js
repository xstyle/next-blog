import Head from 'next/head'
import fetch from 'node-fetch'
import { useState } from 'react'
import { RobotCard } from '../../components/RobotCard'

export async function getServerSideProps(context) {
  const BACKEND_URL = process.env.BACKEND
  const { TOKEN_KVESTGID } = process.env
  const { code } = context.query

  const robot_game_response = await fetch(BACKEND_URL + `/api/robot_game?code=${code}&load_robot=1&token=${TOKEN_KVESTGID}`)

  let robots = []
  let robot_game = null

  if (robot_game_response.status === 200 && code) {
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
      robot_game: robot_game ? {
        name: robot_game.name,
        state: robot_game.state,
        count: robot_game.count,
        code: robot_game.code,
        date: robot_game.date,
        time: robot_game.time,
        players_count: robot_game.players.length
      } : null
    }
  }
}

export default function Robots(props) {

  const { robot_game } = props;
  if (!robot_game) {
    return <div>Игра не найдена. Свяжитесь с адмнистратором...</div>
  }

  const [player_code, setPlayerCode] = useState();

  const show_btn = robot_game.state === 'activated' && (player_code || !robot_game.players_count)
  const show_init = robot_game.state === 'initialized'
  const show_closed = robot_game.state === 'closed'
  const show_player_code_form = !!(robot_game.state == 'activated' && robot_game.players_count)

  return <div className="container pt-5">
    <Head>
      <title>Выберите робота</title>
    </Head>

    <div className="pb-3">
      <h1>{robot_game.name}</h1>
    </div>

    <p>Начало игры {robot_game.date} в {robot_game.time}.</p>
    {show_init && <p>Роботы будут доступны для выбора за 10 минут до начала игры. А пока вы можете познакомиться с роботами и выбрать каким будете управлять. Чтобы быть готовым к битве попробуйте <a href="/wartec/demo">симулятор управления роботом</a>!</p>}
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
