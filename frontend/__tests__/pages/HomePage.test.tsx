/**
 * Tests for Home Page
 */
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
  }),
}));

describe('HomePage', () => {
  it('renders homepage content', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /Find Your Home for a Fixed Price/i })).toBeInTheDocument();
  });

  it('displays hero section', () => {
    render(<HomePage />);
    expect(screen.getByText(/Tired of/i)).toBeInTheDocument();
  });

  it('shows call-to-action / search', () => {
    render(<HomePage />);
    expect(screen.getByPlaceholderText(/Edinburgh, G12, Aberdeen/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Max Budget/i)).toBeInTheDocument();
  });
});
