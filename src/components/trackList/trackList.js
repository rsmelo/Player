import React from 'react';
import PropTypes from 'prop-types';

import { Track } from '../track/track';

import { Input } from '../ui/input/input';
import { Spinner } from '../ui/spinner/spinner';

import './trackList.css';

const ENTER_KEY = 13;


export class TrackList extends React.Component {
    static propTypes = {
        loadTracks: PropTypes.func.isRequired,
        makeSort: PropTypes.func.isRequired,
        tracks: PropTypes.array,
        fetching: PropTypes.bool,
        count: PropTypes.number,
    }

    constructor(props) {
        super(props);
        this.state = {
            searchValue: '',
        };

        this.makeSearch = this.makeSearch.bind(this);
    }

    componentDidMount() {
        this.searchInput.addEventListener('keyup', event => this.makeSearch(event));
        this.searchInput.focus();
    }

    componentWillUnmount() {
        this.searchInput.removeEventListener('keyup', event => this.makeSearch(event));
    }

    makeSearch(event) {
        const { searchValue } = this.state;
        const searchNotEmpty = searchValue.length > 0;

        if (event.keyCode === ENTER_KEY && searchNotEmpty) {
            this.props.loadTracks(searchValue);
        }
    }

    onSearchValueChange(event) {
        this.setState({
            searchValue: event.target.value,
        });
    }

    renderList() {
        const { tracks, count, makeSort } = this.props;
        return (
            count ?
                <ul>
                    <li className='listHeader' key='listHeader'>
                        <div className='trackItem'>
                            <b>Title</b>
                        </div>
                        <div
                            className='itemSmall sortable'
                            onClick={() => makeSort('primaryGenreName')}
                            role='none'
                        >
                            <b>Genre</b>
                        </div>
                        <div
                            className='itemSmall sortable'
                            onClick={() => makeSort('trackTimeMillis')}
                            role='none'
                        >
                            <b>Duration</b>
                        </div>
                        <div
                            className='itemSmall sortable'
                            onClick={() => makeSort('trackPrice')}
                            role='none'
                        >
                            <b>Price</b>
                        </div>
                    </li>
                    {tracks.map((track) => {
                        return <Track key={track.trackId} trackInfo={track} />;
                    })}
                </ul>
                :
                <div className='noResults'>Nothing was found</div>
        );
    }

    render() {
        const { count, fetching } = this.props;

        return (
            <React.Fragment>
                <h1>
                    Here is our track list
                    {count ?
                        <span>&nbsp;({count})</span>
                        : null
                    }
                </h1>
                <Input
                    refFn={(input) => { this.searchInput = input; }}
                    className='searchFieldWrapper'
                    value={this.state.searchValue}
                    onChange={event => this.onSearchValueChange(event)}
                    placeholder='Enter song or artist'
                />
                {fetching ?
                    <div className='spinnerWrapper'>
                        <Spinner />
                    </div>
                    :
                    this.renderList()
                }
            </React.Fragment>
        );
    }
}
