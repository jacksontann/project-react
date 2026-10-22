import { render, screen } from '@testing-library/react';
import { Chrome } from './Chrome';

describe('Chrome', () => {
  it('credits the author with a safe link to the portfolio', () => {
    render(<Chrome />);
    // One copy for desktop (footer) and one for phones/tablets; CSS shows exactly one.
    const links = screen.getAllByRole('link', { name: /jackson tan/i });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute('href', 'https://jacksontan-portfolio.vercel.app/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAccessibleName('Jackson Tan (opens in a new tab)');
    }
  });

  it('names the site without coordinates', () => {
    render(<Chrome />);
    expect(screen.getByText('Lumen Residences · Kuala Lumpur')).toBeInTheDocument();
    expect(screen.queryByText(/° N/)).not.toBeInTheDocument();
  });
});
