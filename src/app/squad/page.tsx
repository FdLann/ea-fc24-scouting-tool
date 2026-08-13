import SquadClient from './SquadClient';

export const metadata = {
  title: 'My Squad & Need Analyzer - FC24 Scout',
  description: 'Analyze your career mode squad strengths, weak positions, and get scout target recommendations.',
};

export default function SquadPage() {
  return <SquadClient />;
}
