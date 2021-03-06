import React from 'react';
import PropTypes from 'prop-types';
import cs from 'classnames';

import { SvgIcon } from '../ui/svgIcon/svgIcon';

import star from './svg/star.svg';
import './addToFavourites.css';


export const AddToFavourites = (props) => {
    const isTrackInFav = props.active.includes(props.track.trackId);

    const titleAttr = isTrackInFav ?
        'Remove track from favourites'
        :
        'Add track to favourites';

    const action = () => {
        if (isTrackInFav) {
            props.removeFromFavourites(props.track);
        } else {
            props.addToFavourites(props.track);
        }
    };

    return (
        <button
            className='favouriteButton'
            type='button'
            onClick={() => action()}
            title={titleAttr}
        >
            <SvgIcon
                className={cs('favouriteIcon', {
                    favouriteIconActive: isTrackInFav,
                })}
                glyph={star}
            />
        </button>
    );
};

AddToFavourites.propTypes = {
    track: PropTypes.object.isRequired,
    active: PropTypes.array.isRequired,
    addToFavourites: PropTypes.func.isRequired,
    removeFromFavourites: PropTypes.func.isRequired,
};
