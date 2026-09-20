import { TAGS } from "../services/dbService";
import searchStyles from "../pages/SearchPage/SearchPage.module.css";
import { clsx } from "../utils";

export default function TagPill({ tagId }) {
    return <span className={clsx(searchStyles.truncated, "tagPill")} style={{"--tag-color": "#a040ff"}}>{TAGS[tagId]}</span>;
}
