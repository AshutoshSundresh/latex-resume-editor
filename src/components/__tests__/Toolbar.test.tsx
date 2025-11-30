import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '../Toolbar';

describe('Toolbar', () => {
  it('should render the toolbar container', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
  });

  it('should render Open button', () => {
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
  });

  it('should render Save button', () => {
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });

  it('should render Save As button', () => {
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
  });

  it('should render Compile button', () => {
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: /compile/i })).toBeInTheDocument();
  });

  it('should render Settings button', () => {
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('should call onOpen when Open button is clicked', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<Toolbar onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: /open/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onSave when Save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Toolbar onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should call onCompile when Compile button is clicked', async () => {
    const user = userEvent.setup();
    const onCompile = vi.fn();
    render(<Toolbar onCompile={onCompile} />);

    await user.click(screen.getByRole('button', { name: /compile/i }));
    expect(onCompile).toHaveBeenCalledTimes(1);
  });
});
