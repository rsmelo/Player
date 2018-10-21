import React from 'react';
import PropTypes from 'prop-types';
import { Howl, Howler } from 'howler';
import cs from 'classnames';

import { PlayButtonContainer } from '../playButton/playButtonContainer';

import { getTrackDuration } from '../../helpers/index';

import { SvgIcon } from '../ui/svgIcon/svgIcon';

import prevIcon from './svg/prevIcon.svg';
import nextIcon from './svg/nextIcon.svg';
import volumeIcon from './svg/volumeIcon.svg';

import './player.css';


export class ReactPlayer extends React.Component {
    static propTypes = {
        pauseTrack: PropTypes.func,
        updateCurrentTrack: PropTypes.func,
        runTrack: PropTypes.func,
        changeVolume: PropTypes.func,
        playlist: PropTypes.array,
        volumeValue: PropTypes.number,
        selectedTrackId: PropTypes.number,
        currentTrack: PropTypes.object,
        isPlaying: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        this.playerTimerRef = React.createRef();

        this.volumeButtonRef = React.createRef();
        this.volumeSliderRef = React.createRef();
        this.volumeControlRef = React.createRef();
        this.volumeBarEmptyRef = React.createRef();

        this.trackProgressEmptyRef = React.createRef();
        this.trackProgressRef = React.createRef();
    }

    state = {
        duration: getTrackDuration(),
        volumeControlVisible: false,
    };

    componentDidMount() {
        const volumeSliderRef = this.volumeSliderRef.current;
        const volumeControlRef = this.volumeControlRef.current;
        const volumeBarEmptyRef = this.volumeBarEmptyRef.current;

        const trackProgressEmptyRef = this.trackProgressEmptyRef.current;

        volumeBarEmptyRef.addEventListener('click', (event) => {
            const per = event.layerX / parseFloat(volumeBarEmptyRef.scrollWidth);
            this.props.changeVolume(per);
        });

        trackProgressEmptyRef.addEventListener('click', (event) => {
            const per = event.layerX / parseFloat(trackProgressEmptyRef.scrollWidth);
            this.seekTrack(per);
        });

        volumeSliderRef.addEventListener('mousedown', () => {
            window.sliderDown = true;
        });
        volumeControlRef.addEventListener('mouseup', () => {
            window.sliderDown = false;
        });
        volumeControlRef.addEventListener('touchend', () => {
            window.sliderDown = true;
        });

        volumeControlRef.addEventListener('mousemove', (event) => {
            this.changeVolumeOnSliderMove(event);
        });
        volumeControlRef.addEventListener('touchmove', (event) => {
            this.changeVolumeOnSliderMove(event);
        });

        document.addEventListener('click', (event) => {
            this.hideVolumeButtonOnOutsideClick(event);
        });
    }

    componentDidUpdate(prevProps) {
        const {
            playlist,
            selectedTrackId,
            currentTrack,
            volumeValue,
            isPlaying,
        } = this.props;

        // check if user want to play a new track
        if (prevProps.selectedTrackId !== selectedTrackId) {
            const newIndex = currentTrack.index;
            const oldIndex = prevProps.currentTrack.index;

            // stop previous track
            if (playlist[oldIndex] && playlist[oldIndex].howl) {
                playlist[oldIndex].howl.stop();
            }

            // play new track
            this.play(newIndex);
        } else if (
            // check if user want to play the same track when pressed pause before
            prevProps.isPlaying !== isPlaying &&
            prevProps.selectedTrackId === selectedTrackId &&
            selectedTrackId !== null
        ) {
            const selected = playlist.find(track => track.id === selectedTrackId);

            if (selected.isPlaying) {
                this.play(currentTrack.index);
            } else {
                this.pause();
            }
        }

        if (prevProps.volumeValue !== volumeValue) {
            Howler.volume(volumeValue);
        }
    }

    componentWillUnmount() {
        const volumeControlRef = this.volumeControlRef.current;

        volumeControlRef.removeEventListener('mousemove', (event) => {
            this.changeVolumeOnSliderMove(event);
        });
        volumeControlRef.removeEventListener('touchmove', (event) => {
            this.changeVolumeOnSliderMove(event);
        });

        document.removeEventListener('click', (event) => {
            this.hideVolumeButtonOnOutsideClick(event);
        });

        this.props.pauseTrack();
        Howler.unload();
    }

    play(trackIndex) {
        let sound;
        const self = this;
        const { playlist } = this.props;
        const data = playlist[trackIndex];

        // If we already loaded this track, use the current one.
        // Otherwise, setup and load a new Howl.
        if (data.howl) {
            sound = data.howl;
        } else {
            sound = new Howl({
                src: [data.file],
                // Force to HTML5 so that the audio can stream in (best for large files).
                html5: true,
                preload: true,
                onplay: () => {
                    self.setState({
                        duration: getTrackDuration(self.getSoundDuration(sound) * 1000),
                    });
                    requestAnimationFrame(self.step.bind(self));
                },
                onend: () => {
                    self.skip('next');
                },
            });
            data.howl = sound;
        }

        // Begin playing the sound.
        sound.play();
    }

    pause() {
        const { playlist, currentTrack: { index } } = this.props;

        // Get the Howl we want to manipulate.
        const sound = playlist[index].howl;

        // Pause the sound.
        sound.pause();
    }

    /**
     * Skip to the next or previous track.
     * @param  {String} direction 'next' or 'prev'.
     */
    skip(direction) {
        const { playlist, currentTrack: { index } } = this.props;
        let newIndex = 0;

        // Get the next track based on the direction of the track.
        if (direction === 'prev') {
            newIndex = index - 1;
            if (newIndex < 0) {
                newIndex = playlist.length - 1;
            }
        } else {
            newIndex = index + 1;
            if (newIndex >= playlist.length) {
                newIndex = 0;
            }
        }

        this.skipTo(newIndex);
    }

    /**
     * Skip to a specific track based on its playlist index.
     * @param  {Number} newIndex Index in the playlist.
     */
    skipTo(newIndex) {
        const {
            playlist,
            runTrack,
            updateCurrentTrack,
            currentTrack: { index },
        } = this.props;

        // Stop current track.
        if (playlist[index].howl) {
            playlist[index].howl.stop();
        }

        // Play a new track.
        updateCurrentTrack(playlist[newIndex].id);
        runTrack(playlist[newIndex].id);
    }

    getSoundSeek(sound) {
        // return current track position in seconds
        return sound.seek() || 0;
    }

    getSoundDuration(sound) {
        // return current track duration in seconds
        return sound.duration();
    }

    step() {
        const self = this;
        const { playlist, currentTrack: { index } } = this.props;
        // Get the Howl we want to manipulate.
        const sound = playlist[index].howl;

        if (sound && sound.playing()) {
            // Determine our current seek position.
            const seek = this.getSoundSeek(sound);
            const duration = this.getSoundDuration(sound);
            const timer = getTrackDuration(seek * 1000);
            const progressBarWidth = (seek / duration).toFixed(4) * 100;

            this.playerTimerRef.current.innerHTML = timer;
            this.trackProgressRef.current.style.width = `${progressBarWidth}%`;

            requestAnimationFrame(self.step.bind(self));
        }
    }

    seekTrack = (value) => {
        const { currentTrack: { index }, playlist } = this.props;
        const sound = playlist[index].howl;

        if (sound) {
            const seek = this.getSoundSeek(sound);
            const duration = this.getSoundDuration(sound);
            const timer = getTrackDuration(seek * 1000);
            const progressBarWidth = (seek / duration).toFixed(4) * 100;

            sound.seek(duration * value);

            this.playerTimerRef.current.innerHTML = timer;
            this.trackProgressRef.current.style.width = `${progressBarWidth}%`;
        }
    }

    toggleVolume() {
        this.setState({
            volumeControlVisible: !this.state.volumeControlVisible,
        });
    }

    hideVolume() {
        if (this.state.volumeControlVisible) {
            this.setState({
                volumeControlVisible: false,
            });
        }
    }

    getValueOnSliderMove(event, element) {
        const x = event.clientX || event.touches[0].clientX;
        const { width, left } = element.getBoundingClientRect();
        let volumeValue = 0;

        // normalized to bar width absolute value
        const absValue = (x - left) > 0 ? (x - left) : 0;

        volumeValue = Math.min(1, absValue / width);
        return volumeValue;
    }

    changeVolumeOnSliderMove(event) {
        if (window.sliderDown) {
            const { changeVolume } = this.props;
            const volumeValue = this.getValueOnSliderMove(
                event,
                this.volumeBarEmptyRef.current,
            );
            changeVolume(volumeValue);
        }
    }

    hideVolumeButtonOnOutsideClick(event) {
        const volumeBtn = this.volumeButtonRef.current;
        const volumeControl = this.volumeControlRef.current;
        const volumeBtnVisible = this.state.volumeControlVisible && volumeBtn;

        if (volumeBtnVisible &&
            !volumeBtn.contains(event.target) &&
            !volumeControl.contains(event.target)
        ) {
            this.hideVolume();
        }
    }

    noTracksLoaded() {
        return this.props.playlist.length === 0;
    }

    prevButton() {
        return (
            <button
                className='playerButton playerButtonSmall'
                onClick={() => this.skip('prev')}
                disabled={this.noTracksLoaded()}
                type='button'
            >
                <SvgIcon
                    className='playerControl'
                    glyph={prevIcon}
                />
            </button>
        );
    }

    nextButton() {
        return (
            <button
                className='playerButton playerButtonSmall'
                onClick={() => this.skip('next')}
                disabled={this.noTracksLoaded()}
                type='button'
            >
                <SvgIcon
                    className='playerControl'
                    glyph={nextIcon}
                />
            </button>
        );
    }

    toggleVolumeButton() {
        return (
            <button
                className='playerButton playerButtonSmall'
                onClick={() => this.toggleVolume()}
                type='button'
                ref={this.volumeButtonRef}
            >
                <SvgIcon
                    className='playerControl'
                    glyph={volumeIcon}
                />
            </button>
        );
    }

    volumeControlBar() {
        const { volumeValue } = this.props;
        const { volumeControlVisible } = this.state;
        const barWidth = `${volumeValue * 100}%`;

        return (
            <div
                ref={this.volumeControlRef}
                className={cs('volumeControl volumeControlMl30', {
                    volumeControlVisible,
                })}
            >
                <div
                    className='volumeBar'
                    style={{ width: barWidth }}
                >
                    <button
                        ref={this.volumeSliderRef}
                        className='volumeSlider'
                    />
                </div>
                <div
                    ref={this.volumeBarEmptyRef}
                    className='volumeBar volumeBarEmpty'
                />
            </div>
        );
    }

    trackProgressBar() {
        return (
            <div className='volumeControl volumeControlVisible'>
                <div
                    ref={this.trackProgressRef}
                    style={{ width: 0 }}
                    className='volumeBar'
                >
                    <button className='volumeSlider' />
                </div>
                <div
                    ref={this.trackProgressEmptyRef}
                    className='volumeBar volumeBarEmpty'
                />
            </div>
        );
    }

    render() {
        const {
            volumeValue,
            playlist,
            currentTrack: { title, index, id },
        } = this.props;
        let trackId = id;

        // When user press play button for the first time
        // currentTrack is empty and trackId is null.
        // Therefore we take the first track from playlist.
        if (!trackId && playlist.length) {
            trackId = playlist[0].id;
        }

        const barWidth = `${Math.round(volumeValue * 100)}%`;

        return (
            <div className='playerWrapper'>
                {this.trackProgressBar()}
                <div className='trackInfoWrapper'>
                    <p>
                        <b ref={this.playerTimerRef}>{getTrackDuration()}</b>
                    </p>
                    <p className='trackInfoName'>
                        {title ?
                            <b>{`${index + 1}. ${title}`}</b>
                            : null
                        }
                    </p>
                    <p>
                        <b>{this.state.duration}</b>
                    </p>
                </div>
                <div className='player'>
                    {this.prevButton()}
                    <PlayButtonContainer
                        id={trackId}
                        disabled={this.noTracksLoaded()}
                    />
                    {this.nextButton()}
                </div>
                <div className='volumeWrapper'>
                    {this.toggleVolumeButton()}
                    {this.volumeControlBar()}
                    <div className='volumeValue'>{barWidth}</div>
                </div>
            </div>
        );
    }
}
