import { getCuratedExperiences } from "@/lib/experiences";
import ExperiencesRow from "./ExperiencesRow";

/** Optional curated cross-city strip for the homepage. Server component. */
export default async function CuratedExperiences() {
  const experiences = await getCuratedExperiences(8);
  return (
    <ExperiencesRow
      experiences={experiences}
      heading="Top experiences to book"
      subtitle="Handpicked tours and tickets across our destinations."
    />
  );
}
