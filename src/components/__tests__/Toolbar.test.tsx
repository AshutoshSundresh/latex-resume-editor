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
    expect(screen.getByTestId('toolbar-open')).toBeInTheDocument();
  });

  it('should render Save button', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('toolbar-save')).toBeInTheDocument();
  });

  it('should render Save As button', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('toolbar-save-as')).toBeInTheDocument();
  });

  it('should render Compile button', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('toolbar-compile')).toBeInTheDocument();
  });

  it('should render Log button', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('toolbar-log')).toBeInTheDocument();
  });

  it('should render Help button', () => {
    render(<Toolbar />);
    expect(screen.getByTestId('toolbar-help')).toBeInTheDocument();
  });

  it('should call onOpen when Open button is clicked', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<Toolbar onOpen={onOpen} />);

    await user.click(screen.getByTestId('toolbar-open'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onSave when Save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Toolbar onSave={onSave} />);

    await user.click(screen.getByTestId('toolbar-save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should call onCompile when Compile button is clicked', async () => {
    const user = userEvent.setup();
    const onCompile = vi.fn();
    render(<Toolbar onCompile={onCompile} />);

    await user.click(screen.getByTestId('toolbar-compile'));
    expect(onCompile).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleLog when Log button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleLog = vi.fn();
    render(<Toolbar onToggleLog={onToggleLog} />);

    await user.click(screen.getByTestId('toolbar-log'));
    expect(onToggleLog).toHaveBeenCalledTimes(1);
  });

  it('should show active state when log is visible', () => {
    render(<Toolbar logVisible={true} />);
    expect(screen.getByTestId('toolbar-log')).toHaveClass('toolbar-btn-active');
  });

  it('should not show active state when log is hidden', () => {
    render(<Toolbar logVisible={false} />);
    expect(screen.getByTestId('toolbar-log')).not.toHaveClass('toolbar-btn-active');
  });

  it('should open help dialog when Help button is clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar />);

    await user.click(screen.getByTestId('toolbar-help'));
    expect(screen.getByTestId('help-dialog')).toBeInTheDocument();
  });

  it('should close help dialog when overlay is clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar />);

    await user.click(screen.getByTestId('toolbar-help'));
    expect(screen.getByTestId('help-dialog')).toBeInTheDocument();

    await user.click(screen.getByTestId('help-dialog'));
    expect(screen.queryByTestId('help-dialog')).not.toBeInTheDocument();
  });
});
