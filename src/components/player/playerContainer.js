import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { playerActions } from '../../actions';

import { ReactPlayer } from './reactPlayer';


function mapStateToProps(state) {
    return {
        tracks: state.list.tracks,
        ...state.player,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(playerActions, dispatch);
}

export const PlayerContainer = connect(mapStateToProps, mapDispatchToProps)(ReactPlayer);
