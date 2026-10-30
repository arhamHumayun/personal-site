import { IceSlide } from "@/components/ice-slide/IceSlide";

export const metadata = {
  title: "Ice Slide",
  description: "A daily ice-sliding puzzle: slide until you hit rock, stop on the exit.",
};

export default function PuzzlePage() {
  return <IceSlide />;
}
