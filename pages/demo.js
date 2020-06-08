import Head from 'next/head'

const ARROW_UP = 'ArrowUp'
const ARROW_DOWN = 'ArrowDown'
const ARROW_LEFT = 'ArrowLeft'
const ARROW_RIGHT = 'ArrowRight'

const SPEED = 2;

export default class Demo extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            top: 500,
            left: 500,
            rotate: 0,
            arrow_left: false,
            arrow_right: false,
            arrow_up: false,
            arrow_down: false
        }
        this.step = this.step.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
    }

    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyDown)
        window.addEventListener('keyup', this.handleKeyUp)
        setInterval(this.step, 1000 / 60);
        console.log(this.container.offsetWidth, this.container.offsetHeight)
        this.setState({top: this.container.offsetHeight / 2, left: this.container.offsetWidth / 2})
    }

    step() {
        const state = {
            left: this.state.left,
            top: this.state.top,
            rotate: this.state.rotate
        }
        if (this.state.arrow_up) {
            state.top = this.beetween(state.top - Math.sin((state.rotate + 90) * Math.PI / 180) * SPEED, 0, this.container.offsetHeight - 100)
            state.left = this.beetween(state.left - Math.cos((state.rotate + 90) * Math.PI / 180) * SPEED, 0, this.container.offsetWidth - 100)
        }
        if (this.state.arrow_down) {
            state.top = this.beetween(state.top + Math.sin((state.rotate + 90) * Math.PI / 180) * SPEED, 0, this.container.offsetHeight - 100)
            state.left = this.beetween(state.left + Math.cos((state.rotate + 90) * Math.PI / 180) * SPEED, 0, this.container.offsetWidth - 100)
        }
        if (this.state.arrow_left) {
            state.rotate = (state.rotate - SPEED * (this.state.arrow_down ? -1 : 1)) % 360
        }
        if (this.state.arrow_right) {
            state.rotate = (state.rotate + SPEED * (this.state.arrow_down ? -1 : 1)) % 360
        }
        this.setState(state)
    }

    beetween(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }

    handleKeyDown(event) {
        if (event.repeat) return;
        switch (event.code) {
            case ARROW_UP:
                this.setState({ arrow_up: true })
                break;
            case ARROW_DOWN:
                this.setState({ arrow_down: true })
                break;
            case ARROW_LEFT:
                this.setState({ arrow_left: true })
                break;
            case ARROW_RIGHT:
                this.setState({ arrow_right: true })
                break;
            default:
                break;
        }
    }
    handleKeyUp(event) {
        switch (event.code) {
            case ARROW_UP:
                this.setState({ arrow_up: false })
                break;
            case ARROW_DOWN:
                this.setState({ arrow_down: false })
                break;
            case ARROW_LEFT:
                this.setState({ arrow_left: false })
                break;
            case ARROW_RIGHT:
                this.setState({ arrow_right: false })
                break;
            default:
                break;
        }
    }
    render() {
        return <>
            <div id="container"
                ref={el => this.container = el}>
                <div
                    className="robot"
                    style={{ top: this.state.top, left: this.state.left, transform: `rotate(${this.state.rotate}deg)` }}>
                    <div>x: {Math.round(this.state.top)}</div>
                    <div>y: {Math.round(this.state.left)}</div>
                    <div>{this.state.rotate}˚</div>
                </div>
            </div>

            <style jsx>{`
                .robot {
                    position: relative;
                    display: inline-block;
                    height: 100px;
                    width: 100px;
                    background-color: green;
                    color: white;
                    border-radius: 10px;
                    text-align: center;
                    padding: 10px;
                }
                #container {
                    height: 100%;
                    width: 100%;
                    position: fixed;
                }
            `}</style>
        </>
    }
}