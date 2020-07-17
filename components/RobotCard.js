export function RobotCard({ robot, show_btn, code, player_code }) {
    return <div className="card bg-dark">
      <img className='card-img-top' src={`/images/${robot.image}`}/>
      <div className="card-body text-center">
        <h4 className="card-title">{robot.name}</h4>
        <p className="card-text">{robot.description}</p>
        {show_btn && <a
          href={`/wartec/control?code=${code}&_robot=${robot._id}${player_code ? `&player_code=${player_code}` : ''}`}
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