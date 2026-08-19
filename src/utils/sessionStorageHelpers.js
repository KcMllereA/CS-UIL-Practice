const PREFIX = "UIL_";

export function getItem(key) {
    key = PREFIX + key;
    if (key in sessionStorage == false) return null;
    try {
        return JSON.parse(sessionStorage.getItem(key));
    } catch {
        return null;
    }
}

export function setItem(key, value) {
    key = PREFIX + key;
    return sessionStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key) {
    return sessionStorage.removeItem(key);
}
