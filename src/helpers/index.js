export function getTrackDuration(time) {
    let sec = '00';
    let min = '00';
    let hour = '00';

    if (time) {
        const seconds = Math.round(time / 1000);
        hour = seconds % 3600;
        hour = (seconds - hour);

        sec = seconds % 60;
        min = (seconds - hour - sec);

        hour /= 3600;
        min /= 60;
    }

    return `${hour}:${min}:${sec}`;
}


export async function requestData(url) {
    const opt = {
        method: 'GET',
    };

    try {
        const query = await fetch(url, opt);
        if (query.status === 200) {
            return query.json();
        }
    } catch (error) {
        console.error(error);
    }
    return {};
}