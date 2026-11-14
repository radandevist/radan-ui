import { toast, Toaster, ToastSkeleton } from '@radandevist/radan-ui/toast';
import { useEffect } from 'react';

// A catalog page: real toasts, opened on mount and kept open (`duration: Infinity`, `expand`), one fixed id per toast so
// StrictMode's second effect cannot duplicate them. Nothing random: the screenshot must be stable.
const labels = {
	default: 'Notification',
	success: 'Done',
	error: 'Error',
	warning: 'Warning',
	info: 'Information',
	loading: 'In progress',
};
const keep = (id: string) => ({ id, duration: Infinity });

const ToastPage = () => {
	useEffect(() => {
		toast('Notification received', { ...keep('default'), description: 'A neutral message with a description.' });
		toast.loading('Saving your changes', keep('loading'));
		toast.info('Notification dismissed', { ...keep('info'), action: { label: 'Undo', onClick: () => {} } });
		toast.warning('Connection is slow', keep('warning'));
		toast.error('Saving failed', { ...keep('error'), description: 'The server did not answer.' });
		toast.success('Order saved', keep('success'));
	}, []);
	return (
		<main className="mx-auto max-w-3xl p-6">
			<h1 className="mb-6 text-xl font-semibold">Toast</h1>
			<Toaster labels={labels} now="now" expand visibleToasts={6} />
			<h2 className="mb-3 text-sm font-semibold text-muted-foreground">ToastSkeleton</h2>
			<ToastSkeleton />
		</main>
	);
};

export default ToastPage;
