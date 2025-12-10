import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from '../LandingPage';
import { vi } from 'vitest';

describe('LandingPage', () => {
  const mockOnContinue = vi.fn();
  const mockOnRecheck = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when all requirements are satisfied', () => {
    const satisfiedRequirements = {
      pdflatex_available: true,
      pdflatex_path: 'C:\\texlive\\bin\\pdflatex.exe',
      all_satisfied: true,
    };

    it('should render the landing page', () => {
      render(
        <LandingPage
          requirements={satisfiedRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('should display the app title', () => {
      render(
        <LandingPage
          requirements={satisfiedRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText('ResumeIDE')).toBeInTheDocument();
    });

    it('should display the tagline', () => {
      render(
        <LandingPage
          requirements={satisfiedRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText('LaTeX Resume Editor')).toBeInTheDocument();
    });

    it('should show pdflatex as satisfied with checkmark', () => {
      render(
        <LandingPage
          requirements={satisfiedRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText('pdflatex')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should display the pdflatex path when found', () => {
      render(
        <LandingPage
          requirements={satisfiedRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText(/C:\\texlive\\bin\\pdflatex.exe/)).toBeInTheDocument();
    });

    it('should show "Get Started" button when satisfied', () => {
      render(
        <LandingPage
          requirements={satisfiedRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should NOT show installation instructions when satisfied', () => {
      render(
        <LandingPage
          requirements={satisfiedRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.queryByText('Installation Instructions')).not.toBeInTheDocument();
    });

    it('should call onContinue when Get Started is clicked', () => {
      render(
        <LandingPage
          requirements={satisfiedRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      fireEvent.click(screen.getByText('Get Started'));
      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('when requirements are not satisfied', () => {
    const missingRequirements = {
      pdflatex_available: false,
      pdflatex_path: null,
      all_satisfied: false,
    };

    it('should show pdflatex as missing with X mark', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText('pdflatex')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });

    it('should display "Not found" status', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });

    it('should show installation instructions when not satisfied', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText('Installation Instructions')).toBeInTheDocument();
    });

    it('should show MiKTeX installation option', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      // Multiple elements contain "MiKTeX" (header and link text)
      expect(screen.getAllByText(/MiKTeX/).length).toBeGreaterThan(0);
      expect(screen.getByText('miktex.org/download')).toBeInTheDocument();
    });

    it('should show TeX Live installation option', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      // Multiple elements contain "TeX Live" (header and link text)
      expect(screen.getAllByText(/TeX Live/).length).toBeGreaterThan(0);
      expect(screen.getByText('tug.org/texlive')).toBeInTheDocument();
    });

    it('should show "Recheck Requirements" button', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText('Recheck Requirements')).toBeInTheDocument();
    });

    it('should show "Continue Anyway" button', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.getByText(/Continue Anyway/)).toBeInTheDocument();
    });

    it('should NOT show "Get Started" button when not satisfied', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });

    it('should call onRecheck when Recheck button is clicked', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      fireEvent.click(screen.getByText('Recheck Requirements'));
      expect(mockOnRecheck).toHaveBeenCalledTimes(1);
    });

    it('should call onContinue when Continue Anyway is clicked', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      fireEvent.click(screen.getByText(/Continue Anyway/));
      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('link attributes', () => {
    const missingRequirements = {
      pdflatex_available: false,
      pdflatex_path: null,
      all_satisfied: false,
    };

    it('should have correct MiKTeX link attributes', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      const miktexLink = screen.getByText('miktex.org/download');
      expect(miktexLink).toHaveAttribute('href', 'https://miktex.org/download');
      expect(miktexLink).toHaveAttribute('target', '_blank');
      expect(miktexLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have correct TeX Live link attributes', () => {
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      const texliveLink = screen.getByText('tug.org/texlive');
      expect(texliveLink).toHaveAttribute('href', 'https://www.tug.org/texlive/');
      expect(texliveLink).toHaveAttribute('target', '_blank');
      expect(texliveLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('CSS classes', () => {
    it('should apply satisfied class when pdflatex is available', () => {
      const satisfiedRequirements = {
        pdflatex_available: true,
        pdflatex_path: '/usr/bin/pdflatex',
        all_satisfied: true,
      };
      render(
        <LandingPage
          requirements={satisfiedRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      const requirementItem = screen.getByText('pdflatex').closest('.requirement-item');
      expect(requirementItem).toHaveClass('satisfied');
    });

    it('should apply missing class when pdflatex is not available', () => {
      const missingRequirements = {
        pdflatex_available: false,
        pdflatex_path: null,
        all_satisfied: false,
      };
      render(
        <LandingPage
          requirements={missingRequirements}
          onContinue={mockOnContinue}
          onRecheck={mockOnRecheck}
        />
      );
      const requirementItem = screen.getByText('pdflatex').closest('.requirement-item');
      expect(requirementItem).toHaveClass('missing');
    });
  });
});
