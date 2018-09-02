import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { playerActions } from '../../actions';

import { ReactPlayer } from './reactPlayer';


function mapStateToProps(state, ownProps) {
    return {
        tracks: ownProps.tracks,
        isPlaying: state.player.isPlaying,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(playerActions, dispatch);
}

export const PlayerContainer = connect(mapStateToProps, mapDispatchToProps)(ReactPlayer);
